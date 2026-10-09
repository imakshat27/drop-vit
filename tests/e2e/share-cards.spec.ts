import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('approved build shares export locally at exact sizes and preserve earned distinctions', async ({
  page,
}) => {
  // Let existing navbar/link prefetch finish before measuring export traffic.
  await page.goto('/projects/canvas', { waitUntil: 'networkidle' });
  const requests: string[] = [];
  page.on('request', (r) => {
    if (
      r.url().startsWith('http://localhost:3100') &&
      !new URL(r.url()).pathname.startsWith('/_next/')
    )
      requests.push(r.url());
  });
  const trigger = page.getByRole('button', { name: 'Share this build' });
  await trigger.click();
  const studio = page.getByRole('dialog', { name: 'Take your work places.' });
  await expect(studio.getByRole('img')).toBeVisible();
  await expect(studio.getByLabel('Your caption')).toContainText('Worth a look: Canvas Club');
  const accessibility = await new AxeBuilder({ page })
    .include('.share-dialog')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  let fieldNotesSquare: Buffer | undefined;
  await expect(studio.getByRole('button', { name: 'Field Notes', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const [label, width, height] of [
    ['Portrait', 1080, 1350],
    ['Story', 1080, 1920],
    ['Square', 1080, 1080],
  ] as const) {
    await studio.getByRole('button', { name: new RegExp(`^${label}`) }).click();
    const download = page.waitForEvent('download');
    await studio.getByRole('button', { name: 'Download PNG' }).click();
    const file = await download;
    const bytes = await readFile((await file.path())!);
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(width);
    expect(bytes.readUInt32BE(20)).toBe(height);
    if (label === 'Square') fieldNotesSquare = bytes;
  }
  await studio.getByRole('button', { name: 'Original', exact: true }).click();
  const originalDownload = page.waitForEvent('download');
  await studio.getByRole('button', { name: 'Download PNG' }).click();
  const original = await readFile((await (await originalDownload).path())!);
  expect(original.readUInt32BE(16)).toBe(1080);
  expect(original.readUInt32BE(20)).toBe(1080);
  expect(original.equals(fieldNotesSquare!)).toBe(false);
  await studio.getByRole('button', { name: 'Remix', exact: true }).click();
  await expect(studio.getByRole('img')).toBeVisible();
  await studio.getByRole('button', { name: 'Field Notes', exact: true }).click();
  await studio.getByRole('button', { name: 'Curator pick', exact: true }).click();
  await expect(studio.getByLabel('Your caption')).toContainText('is a curator pick');
  await studio
    .getByRole('button', { name: /Earned award/ })
    .first()
    .click();
  await expect(studio.getByLabel('Your caption')).toContainText('earned');
  expect(requests).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(studio).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('builder cards fit mobile and workshop cards use owner captions without private data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/builders/ananya');
  await page.getByRole('button', { name: 'Share builder card' }).click();
  const studio = page.getByRole('dialog');
  await expect(studio.getByRole('img')).toBeVisible();
  await expect(studio.getByLabel('Your caption')).toContainText('Meet Ananya Rao');
  await expect(studio.getByLabel('Your caption')).not.toContainText('@vitstudent');
  expect(await studio.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await page.goto('/signin');
  await page.getByLabel('VIT student email', { exact: true }).fill('ananya@vitstudent.ac.in');
  await page.getByLabel('Password', { exact: true }).fill('Drop-test-only-2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/me$/);
  await page.getByRole('button', { name: 'Share my build', exact: true }).first().click();
  await expect(page.getByLabel('Your caption')).toContainText('I’ve been building');
  await expect(page.getByLabel('Your caption')).not.toContainText('@vitstudent');
});
