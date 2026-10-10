import { test, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
/** Browser fixtures only: no auth bypass route or mock identity is shipped in the app. */
export async function login(page: Page, email: string) {
  const path = String(test.info().config.metadata.qaPath);
  if (!/^\.data\/e2e-\d+$/.test(path)) throw new Error('Expected an isolated QA database');
  const tokens = JSON.parse(await readFile(`${path}/session-fixtures.json`, 'utf8'));
  const token = tokens[email]?.shift();
  if (!token) throw new Error('Unknown or exhausted QA account');
  await writeFile(`${path}/session-fixtures.json`, JSON.stringify(tokens), { mode: 0o600 });
  await page.context().addCookies([
    {
      name: 'drop_session',
      value: token,
      url: 'http://localhost:3100',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.goto('/me');
}
