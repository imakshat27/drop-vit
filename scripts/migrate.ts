import { readFile, readdir } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { db, database } from '../src/lib/db';
async function main() {
  await db().execute(
    sql`CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
  );
  for (const file of (await readdir('migrations'))
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f))
    .sort()) {
    const name = file.slice(0, -4);
    const found = await db().execute(sql`SELECT name FROM migrations WHERE name=${name}`);
    if (!found.rows.length) {
      await database().executeScript(
        'BEGIN;' +
          (await readFile(`migrations/${file}`, 'utf8')) +
          `INSERT INTO migrations(name) VALUES('${name}'); COMMIT;`,
      );
      console.log(`Applied ${name}`);
    }
  }
  console.log('Schema up to date');
  await database().close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
