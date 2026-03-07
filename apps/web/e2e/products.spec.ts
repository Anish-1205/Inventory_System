import { test, expect } from '@playwright/test';

// Requires a seeded test DB and running API
test.describe('Products page (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth cookie to bypass middleware
    await page.context().addCookies([
      {
        name: 'refresh_token',
        value: 'test-token',
        domain: 'localhost',
        path: '/api/v1/auth',
      },
    ]);
  });

  test('products page loads', async ({ page }) => {
    await page.goto('/dashboard/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });
});
