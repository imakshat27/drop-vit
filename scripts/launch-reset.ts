import { db, database } from '../src/lib/db';
import { storageRequest } from '../src/lib/image-storage';
import { MEDIA_ID } from '../src/lib/project-media';
import { resetLaunchData } from './launch-reset-data';
import { sql } from 'drizzle-orm';

async function main() {
  const apply = process.argv.includes('--apply');
  const keys: { id: string; staging: boolean }[] = [];
  let cursor = '';
  do {
    const response = await storageRequest(
      '',
      {},
      '?list-type=2&max-keys=500' +
        (cursor ? '&continuation-token=' + encodeURIComponent(cursor) : ''),
    );
    if (!response.ok) throw new Error('Storage listing failed; no reset performed');
    const xml = await response.text();
    for (const item of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = /<Key>([^<]+)<\/Key>/.exec(item[1])?.[1];
      const match = key && /^(staging|images)\/(.+)\.webp$/.exec(key);
      if (!match || !MEDIA_ID.test(match[2]))
        throw new Error('Unexpected storage key; no reset performed');
      keys.push({ id: match[2], staging: match[1] === 'staging' });
    }
    cursor = /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1] || '';
  } while (cursor);
  const counts = await db().execute(
    sql`SELECT (SELECT count(*)::int FROM projects) projects, (SELECT count(*)::int FROM periods) editions, (SELECT count(*)::int FROM users WHERE role='admin') curators`,
  );
  console.log(
    JSON.stringify({
      mode: apply ? 'apply' : 'preview',
      ...counts.rows[0],
      storedImages: keys.length,
    }),
  );
  if (!apply) return;
  console.log(JSON.stringify(await resetLaunchData(db())));
  let removed = 0;
  for (const key of keys) {
    const result = await storageRequest(key.id, { method: 'DELETE' }, '', key.staging);
    if (!result.ok && result.status !== 404)
      throw new Error('Image deletion failed; rerun to finish storage cleanup');
    removed++;
  }
  console.log(JSON.stringify({ imagesRemoved: removed, accountsAndCuratorsPreserved: true }));
}
main()
  .catch(() => {
    console.error('Launch reset failed. Review database and storage state before retrying.');
    process.exitCode = 1;
  })
  .finally(() => database().close());
