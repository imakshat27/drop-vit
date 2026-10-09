import { readFile, writeFile } from 'node:fs/promises';

// OpenNext embeds .env files by default. All server settings must instead come
// from Wrangler bindings/secrets, including in preview; never ship local values.
await writeFile(
  '.open-next/cloudflare/next-env.mjs',
  'export const production = {};\nexport const development = {};\nexport const test = {};\n',
);
console.log('Cloudflare server environment will use runtime bindings only.');
const version = (await readFile('.open-next/assets/BUILD_ID', 'utf8')).trim();
await writeFile(
  '.open-next/drop-cache-version.mjs',
  `export const version = ${JSON.stringify(version)};\n`,
);
