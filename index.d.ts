import { DatabaseSync } from 'bare-sqlite'

/**
 * Register the vector extension's SQL functions and virtual table modules on the given `bare-sqlite` connection. `db` must be an open `DatabaseSync` instance from `bare-sqlite`.
 * @param db - An open `DatabaseSync` connection from `bare-sqlite` to register the vector functions and virtual table modules on.
 * @throws {DATABASE_NOT_OPEN} `db` is not open.
 */
export function register(db: DatabaseSync): void
