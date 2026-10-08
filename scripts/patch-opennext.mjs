import { readFile, writeFile } from 'node:fs/promises';

// Backport https://github.com/opennextjs/opennextjs-cloudflare/pull/1356.
// Next 16.4 loads this manifest on every request. Keep its actual contents.
const file = 'node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js';
const before = '**/{*-manifest,required-server-files,prefetch-hints}.json';
const after = '**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json';
const source = await readFile(file, 'utf8');
if (source.includes(after)) {
  console.log('OpenNext preview manifest compatibility is present.');
} else if (source.includes(before)) {
  await writeFile(file, source.replace(before, after));
  console.log('Applied OpenNext Next.js 16.4 preview manifest compatibility patch.');
} else {
  throw new Error('OpenNext manifest patch changed; review upstream support before building.');
}
