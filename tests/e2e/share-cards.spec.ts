import { login } from './auth-fixture';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';

test('approved build shares export locally at exact sizes and preserve earned distinctions', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as { posterText: string[] };
    state.posterText = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (value, x, y, maxWidth) {
      state.posterText.push(value);
      if (maxWidth === undefined) original.call(this, value, x, y);
      else original.call(this, value, x, y, maxWidth);
    };
  });
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
  await expect(studio.getByRole('button', { name: 'Remix', exact: true })).toHaveCount(0);
  await expect(studio.getByRole('button', { name: 'Original', exact: true })).toHaveCount(0);
  const squares: Buffer[] = [];
  for (const edition of ['Field Notes', 'Flow', 'Signal']) {
    await page.evaluate(() => ((window as unknown as { posterText: string[] }).posterText = []));
    await studio.getByRole('button', { name: edition, exact: true }).click();
    for (const [label, width, height] of [
      ['Portrait', 1080, 1350],
      ['Story', 1080, 1920],
      ['Square', 1080, 1080],
    ] as const) {
      await studio.getByRole('button', { name: new RegExp(`^${label}`) }).click();
      const download = page.waitForEvent('download');
      await studio.getByRole('button', { name: 'Download PNG' }).click();
      const bytes = await readFile((await (await download).path())!);
      expect(bytes.subarray(1, 4).toString()).toBe('PNG');
      expect(bytes.readUInt32BE(16)).toBe(width);
      expect(bytes.readUInt32BE(20)).toBe(height);
      await writeFile(
        `.data/share-${edition.toLowerCase().replaceAll(' ', '-')}-${label.toLowerCase()}.png`,
        bytes,
      );
      if (label === 'Square') squares.push(bytes);
    }
    const painted = await page.evaluate(
      () => (window as unknown as { posterText: string[] }).posterText,
    );
    expect(painted).toContain('CANVAS CLUB');
    expect(painted).not.toContain('Canvas Club');
  }
  expect(squares[0].equals(squares[1])).toBe(false);
  expect(squares[1].equals(squares[2])).toBe(false);
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
  await login(page, 'ananya@vitstudent.ac.in');
  await expect(page).toHaveURL(/\/me$/);
  await page.getByRole('button', { name: 'Share my build', exact: true }).first().click();
  await expect(page.getByLabel('Your caption')).toContainText('I’ve been building');
  await expect(page.getByLabel('Your caption')).not.toContainText('@vitstudent');
});
