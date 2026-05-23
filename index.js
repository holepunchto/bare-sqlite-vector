const { errors } = require('bare-sqlite')
const binding = require('./binding')

exports.register = function register(db) {
  if (!db.isOpen) {
    throw errors.DATABASE_NOT_OPEN('Database is not open')
  }

  try {
    binding.init(db._handle)
  } catch (err) {
    throw errors.from(err)
  }
}
