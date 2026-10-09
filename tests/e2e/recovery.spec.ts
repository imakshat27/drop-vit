import { test, expect } from '@playwright/test';

test('a Cloudflare error during soft navigation stays in the app and retries on demand', async ({
  page,
}) => {
  let fail = true;
  let documents = 0;
  await page.route('**/weekly**', async (route) => {
    if (fail && route.request().headers().rsc === '1') {
      await route.fulfill({
        status: 500,
        contentType: 'text/html',
        body: '<h1>Cloudflare Error 1102</h1>',
      });
    } else await route.continue();
  });
  await page.goto('/');
  page.on('request', (request) => {
    if (request.isNavigationRequest()) documents++;
  });
  await page.locator('nav').getByRole('link', { name: 'Weekly Drop' }).click();
  const toast = page.getByRole('complementary', { name: 'Connection notification' });
  await expect(toast).toContainText('Drop hit a hiccup');
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.getByText('Cloudflare Error 1102')).toHaveCount(0);
  expect(documents).toBe(0);
  fail = false;
  await toast.getByRole('button', { name: 'Try again' }).click();
  await expect(toast).toHaveCount(0);
  await expect(page).toHaveURL(/\/weekly$/);
  await expect(page.locator('.ranking-row').first()).toBeVisible();
  expect(documents).toBe(0);
});

test('a failed action keeps the form open, preserves inputs and never automatically replays', async ({
  page,
}) => {
  await page.goto('/signin');
  let posts = 0;
  await page.route('**/signin', async (route) => {
    if (route.request().method() === 'POST') {
      posts++;
      await route.fulfill({
        status: 500,
        contentType: 'text/html',
        body: 'Worker exceeded resource limits',
      });
    } else await route.continue();
  });
  const email = page.getByLabel('VIT student email', { exact: true });
  const password = page.getByLabel('Password', { exact: true });
  await email.fill('ananya@vitstudent.ac.in');
  await password.fill('Drop-test-only-2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Connection notification' })).toContainText(
    'Couldn’t confirm',
  );
  await expect(page).toHaveURL(/\/signin$/);
  await expect(email).toHaveValue('ananya@vitstudent.ac.in');
  await expect(password).toHaveValue('Drop-test-only-2026!');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
  expect(posts).toBe(1);
});
