import { db, database } from '../src/lib/db';
import { projects } from '../src/lib/schema';
import { storageRequest } from '../src/lib/image-storage';
import { MEDIA_ID } from '../src/lib/project-media';
/** Safe dry run by default; grace period protects in-progress submissions. */
async function main() {
  const referenced = new Set(
    (await db().select({ details: projects.details }).from(projects)).flatMap(
      (p) => p.details.media || [],
    ),
  );
  let cursor = '',
    scanned = 0,
    removed = 0;
  do {
    const query =
      '?list-type=2&max-keys=500' +
      (cursor ? '&continuation-token=' + encodeURIComponent(cursor) : '');
    const response = await storageRequest('', {}, query);
    if (!response.ok) throw new Error('Could not list stored images.');
    const xml = await response.text();
    for (const item of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = /<Key>([^<]+)<\/Key>/.exec(item[1])?.[1];
      const date = /<LastModified>([^<]+)<\/LastModified>/.exec(item[1])?.[1];
      if (!key || !date) continue;
      const match = /^(staging|images)\/(.+)\.webp$/.exec(key);
      if (!match || !MEDIA_ID.test(match[2])) continue;
      scanned++;
      if (
        Date.now() - Date.parse(date) < 86400000 ||
        (match[1] === 'images' && referenced.has('/api/media/' + match[2]))
      )
        continue;
      if (process.argv.includes('--apply')) {
        const result = await storageRequest(
          match[2],
          { method: 'DELETE' },
          '',
          match[1] === 'staging',
        );
        if (!result.ok) throw new Error('Could not remove an unused image.');
      }
      removed++;
    }
    cursor = /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1] || '';
  } while (cursor);
  console.log(
    `${scanned} images checked; ${removed} unused images ${process.argv.includes('--apply') ? 'removed' : 'eligible for cleanup (dry run)'}.`,
  );
  await database().close();
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Image cleanup failed');
  process.exitCode = 1;
});
