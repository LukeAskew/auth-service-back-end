const db = require('../app/lib/database');

async function handle() {
  const command = process.argv[2];
  const start = new Date();

  process.stdout.write(`Starting '${command}'...\n`);

  switch (command) {
    case 'migration':
      await db.migration();
      break;
    case 'rollback':
      await db.rollback();
      break;
    default:
      await db.migrate();
      break;
  }

  process.stdout.write(`Finished '${command}' after ${new Date().getTime() - start.getTime()}ms\n`);
}

handle();
