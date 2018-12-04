const fs = require('fs');
const knex = require('knex');
const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_DATABASE,
} = require('../config');

const CONFIG = {
  client: 'pg',
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_DATABASE,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  },
  migrations: {
    tableName: 'migrations',
  },
};

/**
 * Database instance
 * @type {Object}
 */
const database = knex(CONFIG);

/**
 * Run database migration
 */
async function migrate() {
  try {
    await database.migrate.latest(CONFIG);
  } finally {
    await database.destroy();
  }
}

/**
 * Rollback database migration
 */
async function rollback() {
  try {
    await database.migrate.rollback(CONFIG);
  } finally {
    await database.destroy();
  }
}

/**
 * Create a new migration
 */
function migration() {
  const version = new Date()
    .toISOString()
    .substr(0, 16)
    .replace(/\D/g, '');

  const template = 'module.exports.up = async (db) => {\n  \n};\n\nmodule.exports.down = async (db) => {\n  \n};\n\nmodule.exports.configuration = { transaction: true };\n';

  fs.writeFileSync(
    `migrations/${version}_${process.argv[3] || 'new'}.js`,
    template,
    'utf8',
  );
}

module.exports = {
  database,
  migrate,
  rollback,
  migration,
};
