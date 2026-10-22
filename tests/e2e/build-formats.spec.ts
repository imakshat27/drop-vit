import { test, expect } from '@playwright/test';
import { login } from './auth-fixture';
import AxeBuilder from '@axe-core/playwright';

test('Discover navigation, combined format filters, and non-web project actions work on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Discover', exact: true })
    .click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.locator('#main-navigation a[href="/discover"]')).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('combobox', { name: 'Build format', exact: true }).click();
  await page.getByRole('option', { name: 'CLI tool', exact: true }).click();
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.locator('.project-card')).toHaveCount(1);
  await expect(page.locator('.project-card')).toContainText('Terminal Compass');
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/format=cli/);
  await expect(page.locator('.project-card')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page }).analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({ path: '.data/build-format-discovery-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Clear filters' }).click();
  await expect.poll(() => page.locator('.project-card').count()).toBeGreaterThan(1);
  await page.goto('/projects/qa-cli');
  await expect(
    page.getByRole('link', { name: 'Get the CLI', exact: true }).first(),
  ).toHaveAttribute('href', 'https://example.com/cli');
  await expect(page.locator('.setup')).toContainText('compass --help');
  await page.goto('/projects/qa-package');
  await expect(
    page.getByRole('link', { name: 'Get the package', exact: true }).first(),
  ).toHaveAttribute('href', 'https://example.com/package');
  await expect(page.locator('.setup')).toContainText('npm install');
  await page.screenshot({ path: '.data/build-format-package-mobile.png', fullPage: true });
});

test('CLI submissions need no website or open-source checkbox, and preserve format and instructions when edited', async ({
  page,
}) => {
  await login(page, 'ananya@vitstudent.ac.in');
  await page.goto('/submit');
  await page.getByRole('combobox', { name: 'What kind of build is it?' }).click();
  await page.getByRole('option', { name: 'CLI tool', exact: true }).click();
  await page.getByLabel('Name of your build').fill('Folder Pilot CLI');
  await page.getByLabel('The one-line pitch').fill('Navigate research folders from your terminal.');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page
    .getByLabel('The story', { exact: true })
    .fill(
      'A terminal tool for organizing research notes and moving between experiments. Designed to work locally without needing a hosted website.',
    );
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page
    .getByLabel('Repository URL', { exact: true })
    .fill('https://codeberg.org/example/folder-pilot');
  await page
    .getByLabel('How to try it (optional)', { exact: true })
    .fill('Download a release, then run:\npilot --help');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.preview-summary')).toContainText('CLI tool');
  await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
  await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
  await expect(page.locator('.setup')).toContainText('pilot --help');
  await expect(
    page.getByRole('link', { name: 'Explore the repository', exact: true }).first(),
  ).toHaveAttribute('href', 'https://codeberg.org/example/folder-pilot');
  await page.getByRole('link', { name: 'Edit and resubmit →' }).click();
  await expect(page.getByRole('combobox', { name: 'What kind of build is it?' })).toContainText(
    'CLI tool',
  );
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByLabel('How to try it (optional)', { exact: true })).toHaveValue(
    'Download a release, then run:\npilot --help',
  );
});
