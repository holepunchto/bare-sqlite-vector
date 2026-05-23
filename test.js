const test = require('brittle')
const { DatabaseSync } = require('bare-sqlite')
const vector = require('.')

test('register adds vector functions to the connection', (t) => {
  using db = new DatabaseSync(':memory:')
  vector.register(db)
  const row = db.prepare('SELECT vector_version() AS v').get()
  t.is(typeof row.v, 'string')
})

test('vector functions are unknown before register', (t) => {
  using db = new DatabaseSync(':memory:')
  t.exception(() => db.prepare('SELECT vector_version()').get(), /no such function/)
})

test('register throws when the database is not open', (t) => {
  using db = new DatabaseSync(':memory:')
  db.close()
  t.exception(() => vector.register(db), /DATABASE_NOT_OPEN/)
})

test('register is idempotent', (t) => {
  using db = new DatabaseSync(':memory:')
  vector.register(db)
  vector.register(db)
  const row = db.prepare('SELECT vector_version() AS v').get()
  t.is(typeof row.v, 'string')
})

test('vector_backend returns a backend name', (t) => {
  using db = new DatabaseSync(':memory:')
  vector.register(db)
  const row = db.prepare('SELECT vector_backend() AS b').get()
  t.is(typeof row.b, 'string')
  t.ok(row.b.length > 0)
})

test('vector_as_f32 encodes a JSON array as a 4-bytes-per-element BLOB', (t) => {
  using db = new DatabaseSync(':memory:')
  vector.register(db)
  const row = db.prepare("SELECT vector_as_f32('[1.0, 2.0, 3.0, 4.0]') AS b").get()
  t.ok(Buffer.isBuffer(row.b))
  t.is(row.b.length, 16)

  const floats = new Float32Array(row.b.buffer, row.b.byteOffset, row.b.length / 4)
  t.alike(Array.from(floats), [1, 2, 3, 4])
})

test('vector_full_scan returns nearest neighbours sorted by distance', (t) => {
  using db = new DatabaseSync(':memory:')
  vector.register(db)

  db.exec('CREATE TABLE points (id INTEGER PRIMARY KEY, v BLOB)')

  const insert = db.prepare('INSERT INTO points (id, v) VALUES (?, vector_as_f32(?))')
  const vecs = [
    '[1.0, 0.0, 0.0, 0.0]',
    '[0.0, 1.0, 0.0, 0.0]',
    '[0.0, 0.0, 1.0, 0.0]',
    '[0.0, 0.0, 0.0, 1.0]'
  ]
  for (let i = 0; i < vecs.length; i++) insert.run(i + 1, vecs[i])

  db.prepare("SELECT vector_init('points', 'v', 'type=FLOAT32,dimension=4,distance=L2')").get()

  const rows = db
    .prepare(
      "SELECT rowid, distance FROM vector_full_scan('points', 'v', vector_as_f32('[0.9, 0.1, 0.0, 0.0]'), 4)"
    )
    .all()

  t.is(rows.length, 4)
  t.is(rows[0].rowid, 1, 'nearest is the [1,0,0,0] vector')
  t.ok(rows[0].distance < rows[1].distance, 'rows are sorted by distance')
  t.ok(rows[0].distance < 0.5, 'nearest distance is small')
})

test('vector_full_scan in streaming mode works with SQL LIMIT', (t) => {
  using db = new DatabaseSync(':memory:')
  vector.register(db)

  db.exec('CREATE TABLE points (id INTEGER PRIMARY KEY, v BLOB)')
  const insert = db.prepare('INSERT INTO points (id, v) VALUES (?, vector_as_f32(?))')
  for (let i = 1; i <= 5; i++) {
    insert.run(i, `[${i}.0, 0.0, 0.0, 0.0]`)
  }

  db.prepare("SELECT vector_init('points', 'v', 'type=FLOAT32,dimension=4')").get()

  const rows = db
    .prepare(
      "SELECT rowid, distance FROM vector_full_scan('points', 'v', vector_as_f32('[1.0, 0.0, 0.0, 0.0]')) LIMIT 3"
    )
    .all()

  t.is(rows.length, 3)
})

test('vector_quantize + vector_quantize_scan return rows', (t) => {
  using db = new DatabaseSync(':memory:')
  vector.register(db)

  db.exec('CREATE TABLE points (id INTEGER PRIMARY KEY, v BLOB)')
  const insert = db.prepare('INSERT INTO points (id, v) VALUES (?, vector_as_f32(?))')
  const vecs = [
    '[1.0, 0.0, 0.0, 0.0]',
    '[0.0, 1.0, 0.0, 0.0]',
    '[0.0, 0.0, 1.0, 0.0]',
    '[0.0, 0.0, 0.0, 1.0]',
    '[1.0, 1.0, 0.0, 0.0]',
    '[0.0, 1.0, 1.0, 0.0]',
    '[0.0, 0.0, 1.0, 1.0]',
    '[1.0, 1.0, 1.0, 0.0]',
    '[0.0, 1.0, 1.0, 1.0]',
    '[1.0, 1.0, 1.0, 1.0]'
  ]
  for (let i = 0; i < vecs.length; i++) insert.run(i + 1, vecs[i])

  db.prepare("SELECT vector_init('points', 'v', 'type=FLOAT32,dimension=4,distance=L2')").get()
  db.prepare("SELECT vector_quantize('points', 'v')").get()

  const rows = db
    .prepare(
      "SELECT rowid, distance FROM vector_quantize_scan('points', 'v', vector_as_f32('[1.0, 0.0, 0.0, 0.0]'), 3)"
    )
    .all()

  t.is(rows.length, 3)
  for (const row of rows) t.is(typeof row.distance, 'number')
})
