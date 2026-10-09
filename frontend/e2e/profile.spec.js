// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Profile Page Browser Validation', () => {
  test('Test A: Direct /profile navigation with guest session renders without black screen or React crash', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Seed guest session in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('seamas_user_session', JSON.stringify({
        id: 'guest-test-uuid',
        name: 'Guest Explorer',
        email: 'guest@seamas.local',
        isGuest: true,
        tier: 'Free',
        credits: 50
      }));
    });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Confirm body and main containers are rendered
    await expect(page.locator('body')).toBeVisible();
    
    // Check that error boundary or crash is NOT rendered
    const crashHeader = page.locator('h1:has-text("This page could not be displayed")');
    await expect(crashHeader).not.toBeVisible();

    // Verify Profile content rendered
    await expect(page.getByRole('heading', { name: 'Profile Credentials' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guest Explorer' })).toBeVisible();

    // Verify no black screen / transparent root
    const rootVisible = await page.locator('#root').isVisible();
    expect(rootVisible).toBe(true);

    console.log('Console Errors Captured:', consoleErrors);
    // Ensure no ReferenceError or Award crash occurred
    const awardError = consoleErrors.find(e => e.includes('Award is not defined') || e.includes('ReferenceError'));
    expect(awardError).toBeUndefined();
  });

  test('Test B: Refresh while on /profile persists layout without crash', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('seamas_user_session', JSON.stringify({
        id: 'guest-test-uuid',
        name: 'Guest Explorer',
        email: 'guest@seamas.local',
        isGuest: true,
        tier: 'Free',
        credits: 50
      }));
    });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Profile remains visible after refresh
    await expect(page.getByRole('heading', { name: 'Guest Explorer' })).toBeVisible();
    const crashHeader = page.locator('h1:has-text("This page could not be displayed")');
    await expect(crashHeader).not.toBeVisible();
  });

  test('Test C: Navigate Dashboard -> Profile via UI', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('seamas_user_session', JSON.stringify({
        id: 'guest-test-uuid',
        name: 'Guest Explorer',
        email: 'guest@seamas.local',
        isGuest: true,
        tier: 'Free',
        credits: 50
      }));
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click profile button/link in sidebar or navigation
    const profileBtn = page.locator('button:has-text("Profile"), a:has-text("Profile"), [aria-label="Profile"]');
    if (await profileBtn.count() > 0) {
      await profileBtn.first().click();
      await page.waitForURL('**/profile');
      await expect(page.locator('text=Guest Explorer')).toBeVisible();
    }
  });

  test('Test D: Unauthenticated /profile redirects to /login gracefully', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Should redirect to /login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Test E: Corrupt localStorage session redirects gracefully without black screen', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('seamas_user_session', '{invalid-json');
    });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Should redirect to /login rather than crashing
    await expect(page).toHaveURL(/.*login/);
  });
});
