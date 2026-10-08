import { Pool } from 'pg';
import { createEmailTransport } from '../src/lib/email';

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('Database: missing DATABASE_URL (local demo database is still active).');
    return false;
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 15000,
    query_timeout: 15000,
  });
  try {
    await pool.query('SELECT 1');
    const result = await pool.query("SELECT to_regclass('public.migrations') AS migrations");
    if (!result.rows[0].migrations) {
      console.error('Database: connected; schema missing. Run npm run db:migrate.');
      return false;
    }
    // Compare names only; never print connection strings or application records.
    const { readdir } = await import('node:fs/promises');
    const expected = (await readdir('migrations'))
      .filter((file) => /^\d{4}_[a-z0-9_]+\.sql$/.test(file))
      .map((file) => file.slice(0, -4));
    const applied = await pool.query('SELECT name FROM migrations');
    const pending = expected.filter((name) => !applied.rows.some((row) => row.name === name));
    if (pending.length) {
      console.error(
        `Database: connected; ${pending.length} pending migration(s). Run npm run db:migrate.`,
      );
      return false;
    }
    console.log('Database: connected and migrations up to date.');
    return true;
  } catch {
    console.error(
      'Database: connection/schema check failed. Check credentials, network, and provider TLS settings.',
    );
    return false;
  } finally {
    await pool.end();
  }
}

async function checkEmail() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    console.error('SMTP: missing SMTP_HOST or SMTP_FROM.');
    return false;
  }
  let transport;
  try {
    transport = createEmailTransport();
    await transport.verify();
    console.log(
      'SMTP: connection and authentication verified. Sender-domain approval and delivery still need a real email test.',
    );
    return true;
  } catch {
    console.error(
      'SMTP: verification failed. Check host, port, credential pair, and provider access.',
    );
    return false;
  } finally {
    transport?.close();
  }
}

async function main() {
  let originValid = false;
  try {
    const origin = new URL(process.env.APP_URL || '');
    originValid =
      ['http:', 'https:'].includes(origin.protocol) &&
      !origin.username &&
      !origin.password &&
      origin.pathname === '/' &&
      !origin.search &&
      !origin.hash;
  } catch {
    /* Report below without exposing configuration. */
  }
  console.log(
    originValid
      ? 'APP_URL: valid origin; confirm it matches the running app.'
      : 'APP_URL: set a valid http(s) origin.',
  );
  const checks = await Promise.all([checkDatabase(), checkEmail()]);
  if (!originValid || checks.includes(false)) process.exitCode = 1;
}
void main();
