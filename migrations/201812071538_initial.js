
exports.up = async (db) => {
  await db.raw(`
    CREATE EXTENSION IF NOT EXISTS "citext";
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);

  await db.raw(`
    CREATE TYPE oauth_provider AS ENUM ('github', 'google');
  `);

  await db.schema.createTable('users', (table) => {
    table
      .increments('id');

    table
      .text('email');

    table
      .text('password');

    table
      .text('name');

    table
      .specificType('username', 'citext')
      .unique();

    table
      .timestamp('created_on')
      .defaultTo(db.fn.now());

    table
      .timestamp('last_login');
  });

  await db.raw('CREATE UNIQUE INDEX users_email_unique ON users (lower(email));');

  await db.schema.createTable('sessions', (table) => {
    table
      .integer('user_id');

    table
      .foreign('user_id')
      .references('users.id');

    table
      .text('uuid', 36)
      .defaultTo(db.raw('uuid_generate_v4()'))
      .unique();

    table
      .text('token')
      .unique();

    table
      .specificType('oauth_provider', 'oauth_provider');

    table
      .specificType('status', 'int2')
      .defaultTo(1);

    table
      .timestamp('created_at')
      .defaultTo(db.fn.now());

    table
      .timestamp('expires')
      .notNullable()
      .defaultTo(db.fn.now());
  });

  await db.schema.createTable('oauth', (table) => {
    table
      .integer('user_id')
      .notNullable();

    table
      .foreign('user_id')
      .references('users.id');

    table
      .specificType('provider', 'oauth_provider')
      .notNullable();

    table
      .text('token')
      .notNullable()
      .unique();

    table
      .primary(['user_id', 'provider']);
  });
};

exports.down = async (db) => {
  await db.schema.dropTable('oauth');
  await db.schema.dropTable('sessions');
  await db.schema.dropTable('users');

  await db.raw(`
    DROP TYPE oauth_provider;
  `);

  await db.raw(`
    DROP EXTENSION "citext";
    DROP EXTENSION "uuid-ossp";
  `);
};
