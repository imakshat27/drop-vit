import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const password = 'Drop-test-only-2026!';
async function login(page: Page, email: string) {
  await page.goto('/signin');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/me$/);
}
async function logout(page: Page) {
  await page.goto('/me');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
test('verified support persists once and historical results remain locked', async ({ page }) => {
  await login(page, 'ananya@demo.drop.test');
  await page.goto('/weekly');
  const row = page
    .locator('.ranking-row')
    .filter({ has: page.getByRole('link', { name: 'Patchwork', exact: true }) });
  const button = row.getByRole('button');
  await expect(button).toContainText('128');
  await button.click();
  await expect(button).toContainText('129');
  await expect(button).toBeDisabled();
  await page.reload();
  await expect(row.getByRole('button')).toBeDisabled();
  await expect(row.getByRole('button')).toContainText('129');
  await page.goto('/weekly?period=week-17');
  await expect(page.getByText('LOCKED FOREVER', { exact: true })).toBeVisible();
  await expect(page.locator('.support').first()).toBeDisabled();
});
test('submission preview, private review, requested changes, approval and next-week schedule', async ({
  page,
}) => {
  await login(page, 'ananya@demo.drop.test');
  await page.goto('/submit');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Give your build a name');
  await page.getByLabel('Name of your build').fill('Lab Lantern');
  await page.getByLabel('The one-line pitch').fill('A shared research notebook for student labs.');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page
    .getByLabel('The story', { exact: true })
    .fill(
      'A fictional student-built shared notebook for experiments, handover notes, and lab equipment checklists. Built to make student research groups more thoughtful and reproducible.',
    );
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/\/submit$/);
  await expect(page.getByRole('heading', { name: 'Looking good. Ready to Drop?' })).toBeVisible();
  await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
  await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
  const detail = new URL(page.url()).pathname;
  await page.goto('/admin');
  await expect(
    page.getByText('This workspace is for Drop’s curation team.', { exact: false }),
  ).toBeVisible();
  await logout(page);
  await page.goto(detail);
  await expect(page.getByRole('heading', { name: 'This build is off the grid.' })).toBeVisible();
  await page.goto('/discover?q=Lab+Lantern');
  await expect(page.locator('.project-card')).toHaveCount(0);
  await login(page, 'admin@demo.drop.test');
  await page.goto('/admin');
  const review = page
    .locator('.admin-card')
    .filter({ has: page.getByRole('link', { name: 'Lab Lantern ↗', exact: true }) });
  await review.getByLabel('Decision').selectOption('changes');
  await review
    .getByLabel('A useful note for the builder')
    .fill('Explain how handover notes are organized.');
  await review.getByRole('button', { name: 'Save review' }).click();
  await expect(review).toContainText('Decision saved');
  await logout(page);
  await login(page, 'ananya@demo.drop.test');
  const own = page
    .locator('.admin-card')
    .filter({ has: page.getByRole('link', { name: 'Lab Lantern ↗', exact: true }) });
  await expect(own).toContainText('Changes requested');
  await own.getByRole('link', { name: 'Make changes & resubmit →' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page
    .getByLabel('Your approach (optional)')
    .fill('Handover notes are grouped by experiment and date.');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Looking good. Ready to Drop?' })).toBeVisible();
  await page.getByRole('button', { name: 'Resubmit for review' }).click();
  await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
  await logout(page);
  await login(page, 'admin@demo.drop.test');
  await page.goto('/admin');
  await review.getByLabel('A useful note for the builder').fill('Approved.');
  await review.getByRole('button', { name: 'Save review' }).click();
  await expect(review).toHaveCount(0);
  await page.goto('/weekly?period=week-19');
  await expect(page.getByRole('link', { name: 'Lab Lantern', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Voting has not opened/ })).toBeDisabled();
  await logout(page);
  await page.goto('/discover?q=Lab+Lantern');
  await expect(page.locator('.project-card')).toHaveCount(1);
  await page.goto(detail);
  await expect(page.getByText('First Project', { exact: true })).toBeVisible();
});
test('new accounts stay unverified and cannot support until email verification', async ({
  page,
}) => {
  await page.goto('/signup');
  await page.getByLabel('Your name').fill('QA Builder');
  await page.getByLabel('Email', { exact: true }).fill('qa-builder@demo.drop.test');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create my profile' }).click();
  await expect(page).toHaveURL(/\/me\?welcome=1/);
  await expect(page.getByText('Email verification is still pending.')).toBeVisible();
  await page.goto('/weekly');
  await page.locator('.support').first().click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Verify your email');
});
for (const width of [375, 768, 1024, 1440])
  test(`public routes fit ${width}px and pass automated accessibility checks`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      '/',
      '/weekly',
      '/discover',
      '/projects/patchwork',
      '/honors',
      '/honors?view=hall',
      '/recruit',
      '/builders/ananya',
      '/signin',
      '/signup',
    ]) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${route} should fit ${width}px`).toBe(false);
      const audit = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        route,
      ).toEqual([]);
    }
    await page.goto('/');
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  });
test('mobile menu, reduced motion and empty search remain operable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('link', { name: 'Weekly Drop', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Weekly Drop', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The Weekly Drop.' })).toBeVisible();
  await page.goto('/discover?q=no-such-build');
  await expect(page.getByRole('heading', { name: 'Nothing here. Yet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Reset discovery' }).click();
  await expect(page.locator('.project-card').first()).toBeVisible();
});
test('curators can issue permanent badges and manage unranked recruitment', async ({ page }) => {
  await login(page, 'admin@demo.drop.test');
  await page.goto('/admin');
  await page.getByLabel('Project', { exact: true }).selectOption('folio');
  await page.getByLabel('Badge title').fill('Exhibition Pick');
  await page
    .getByLabel('Why it earned this')
    .fill('Thoughtful storytelling and an accessible first release.');
  await page.getByRole('button', { name: 'Award permanent badge' }).click();
  await page.goto('/projects/folio');
  await expect(page.getByText('Exhibition Pick', { exact: true })).toBeVisible();
  await page.goto('/builders/ishaan?tab=achievements');
  await expect(page.getByText('Exhibition Pick', { exact: true })).toBeVisible();
  await page.goto('/admin');
  const role = page.locator('#roles .admin-list-item').filter({ hasText: 'Frontend collaborator' });
  await role.getByRole('button', { name: 'Close role' }).click();
  await expect(role).toContainText('closed');
  await page.goto('/recruit');
  await expect(
    page.getByRole('heading', { name: 'Frontend collaborator', exact: true }),
  ).toHaveCount(0);
  await page.goto('/admin');
  await role.getByRole('button', { name: 'Reopen role' }).click();
  await page.goto('/recruit');
  await expect(
    page.getByRole('heading', { name: 'Frontend collaborator', exact: true }),
  ).toBeVisible();
});
test('builder profile edits persist and invalid verification links stay actionable', async ({
  page,
}) => {
  await login(page, 'ishaan@demo.drop.test');
  await page.goto('/me?edit=1');
  await page.getByLabel('A little about you').fill('Building thoughtful tools for student makers.');
  await page.getByRole('button', { name: 'Save builder profile' }).click();
  await expect(page.getByText('Builder profile updated.', { exact: true })).toBeVisible();
  await page.goto('/builders/ishaan');
  await expect(
    page.getByText('Building thoughtful tools for student makers.', { exact: true }),
  ).toBeVisible();
  await page.goto('/verify?token=invalid');
  await page.getByRole('button', { name: 'Verify my email' }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'verification link is invalid',
  );
});
test('landscape mobile and tablet support comfortable navigation', async ({ page }) => {
  for (const size of [
    { width: 812, height: 375 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size);
    for (const route of ['/', '/weekly', '/projects/patchwork', '/recruit']) {
      await page.goto(route);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true);
    }
  }
});

test('orbital scene can pause and reduced motion stays static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Warp space', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-warp', 'on');
  await expect(page.getByRole('link', { name: 'Explore Canvas Club', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restore orbit', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-warp', 'off');
  const orbit = page.locator('.portal-orbit');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'running');
  await expect(orbit).toHaveCSS('animation-play-state', 'running');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused');
  await expect(orbit).toHaveCSS('animation-play-state', 'paused');
  await expect(page.locator('.ribbon-track')).toHaveCSS('animation-play-state', 'paused');
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(orbit).toHaveCSS('animation-play-state', 'running');
  await page.getByRole('link', { name: 'Explore Canvas Club', exact: true }).focus();
  await expect(orbit).toHaveCSS('animation-play-state', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('button', { name: 'Reduced motion' })).toBeDisabled();
  await expect(orbit).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.ribbon-track')).toHaveCSS('animation-name', 'none');
});
