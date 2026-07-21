# bare-sqlite-vector

SQLite Vector bindings for Bare. Statically embeds the `sqlite-vector` extension from <https://github.com/sqliteai/sqlite-vector> and registers it against an existing `bare-sqlite` connection from <https://github.com/holepunchto/bare-sqlite>, adding vector encoding, nearest-neighbour search, and quantization-based ANN search to ordinary SQLite tables.

```
npm i bare-sqlite-vector
```

## Usage

```js
const { DatabaseSync } = require('bare-sqlite')
const vector = require('bare-sqlite-vector')

const db = new DatabaseSync(':memory:')
vector.register(db)

db.exec(`
  CREATE TABLE points (id INTEGER PRIMARY KEY, v BLOB);
  INSERT INTO points (v) VALUES (vector_as_f32('[1.0, 0.0, 0.0, 0.0]'));
  INSERT INTO points (v) VALUES (vector_as_f32('[0.0, 1.0, 0.0, 0.0]'));
`)

db.prepare("SELECT vector_init('points', 'v', 'type=FLOAT32,dimension=4,distance=L2')").get()

const rows = db
  .prepare(
    "SELECT rowid, distance FROM vector_full_scan('points', 'v', vector_as_f32('[0.9, 0.1, 0.0, 0.0]'), 2)"
  )
  .all()
```

<!-- bare-refgen:api start -->

## API

### Functions

#### `register(db: DatabaseSync): void`

[source](https://github.com/holepunchto/bare-sqlite-vector/blob/v0.1.1/index.d.ts#L3)

Register the vector extension's SQL functions and virtual table modules on the given `bare-sqlite` connection. `db` must be an open `DatabaseSync` instance from `bare-sqlite`.

**Parameters**

| Parameter | Type           | Default | Description                                                                                                         |
| --------- | -------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `db`      | `DatabaseSync` | —       | An open `DatabaseSync` connection from `bare-sqlite` to register the vector functions and virtual table modules on. |

**Throws**

- `DATABASE_NOT_OPEN` — `db` is not open.

<!-- bare-refgen:api end -->

## License

Apache-2.0 and Elastic-2.0
