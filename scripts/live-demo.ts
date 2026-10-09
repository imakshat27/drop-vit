import { db, database } from '../src/lib/db';
import { changeDemoData } from './live-demo-data';

async function main() {
  const flags = process.argv.slice(2);
  if (flags.some((flag) => !['--apply', '--cleanup'].includes(flag)))
    throw new Error('Unknown option. Use --apply and optionally --cleanup.');
  if (!flags.includes('--apply')) {
    console.log(
      'Preview only. Seed: npm run demo:seed -- --apply. Cleanup: npm run demo:cleanup -- --apply. Uses DATABASE_URL from .env.local.',
    );
    return;
  }
  try {
    console.log(JSON.stringify(await changeDemoData(db(), flags.includes('--cleanup'))));
  } finally {
    await database().close();
  }
}
main().catch(() => {
  // Drivers can embed credential-bearing connection strings in exceptions.
  console.error(
    'Demo operation failed; transaction rolled back. Check connectivity or fixture ID/dependency conflicts.',
  );
  process.exitCode = 1;
});
