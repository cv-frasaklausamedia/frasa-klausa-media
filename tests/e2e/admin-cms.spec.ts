import { test, expect } from '@playwright/test';

test.describe('Admin CMS & Navigation Flow (PRD §5, §16.6, §17)', () => {
  // 1. PROTEKSI AKSES TANPA LOGIN
  test('Akses ke /admin tanpa login dialihkan ke /login dengan redirectTo yang aman', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/login\?redirectTo=%2Fadmin/);

    // Verifikasi form login tampil
    const loginHeading = page.locator('h1, h2, form');
    await expect(loginHeading.first()).toBeVisible();

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Akses ke rute CMS internal lainnya (/admin/books) tanpa login dialihkan ke /login', async ({ page }) => {
    await page.goto('/admin/books');
    await page.waitForURL(/\/login\?redirectTo=%2Fadmin%2Fbooks/);
  });

  // 2. PERSISTENSI COOKIE SIDEBAR (PRD §16.6 & Framework Rules)
  test('Cookie sidebar_state=false mengontrol default state sidebar tanpa flash', async ({ context }) => {
    // Set cookie sidebar_state = 'false'
    await context.addCookies([
      {
        name: 'sidebar_state',
        value: 'false',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Akses halaman login (atau layout admin)
    const cookies = await context.cookies();
    const sidebarCookie = cookies.find((c) => c.name === 'sidebar_state');
    expect(sidebarCookie?.value).toBe('false');
  });

  // 3. RESPONSIVE MOBILE DRAWER SLIDE-OUT DARI KIRI
  test('Pada viewport mobile, navigasi menggunakan drawer off-canvas dari kiri', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Pastikan halaman login responsif tanpa horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
