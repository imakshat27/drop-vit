import { test, expect } from '@playwright/test';
import { login } from './auth-fixture';

test('future builds, media and profile work stay private even when browsing as a curator', async ({
  page,
}) => {
  const media = await page.request.get('/api/media/YW5hbnlh.00000000-0000-4000-8000-000000000001');
  expect(media.status()).toBe(404);
  expect(media.headers()['cache-control']).toContain('no-store');
  for (const path of [
    '/projects/qa-scheduled',
    '/discover?q=Unreleased+QA',
    '/honors?kind=weekly&period=week-19',
    '/weekly?period=week-19',
    '/builders/ananya',
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: 'Unreleased QA build', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Unreleased QA build', exact: true })).toHaveCount(
      0,
    );
  }
  await login(page, 'admin@vitstudent.ac.in');
  await page.goto('/discover?q=Unreleased+QA');
  await expect(page.locator('.project-card')).toHaveCount(0);
  await page.goto('/projects/qa-scheduled');
  await expect(page.getByText('Scheduled · private preview', { exact: true })).toBeVisible();
  await expect(page.getByText(/Scheduled for the next Drop:.*at 00:00 IST/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share this build' })).toHaveCount(0);
  await page.goto('/honors?kind=weekly');
  await page.getByRole('combobox', { name: 'Edition' }).click();
  await expect(page.getByRole('option', { name: /Drop #19/ })).toHaveCount(0);
});
