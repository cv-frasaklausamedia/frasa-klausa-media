import { test, expect } from '@playwright/test';

test.describe('Super Admin Access & Account Security (PRD §5, §15.2, §17)', () => {
  test('Akses tanpa login ke /admin/users (manajemen akun) ditolak dan diarahkan ke /login', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForURL(/\/login\?redirectTo=%2Fadmin%2Fusers/);
  });

  test('Akses tanpa login ke /admin/settings (pengaturan sistem) ditolak dan diarahkan ke /login', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForURL(/\/login\?redirectTo=%2Fadmin%2Fsettings/);
  });

  test('Form login menolak percobaan login dengan kredensial palsu / brute force', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitBtn = page.getByRole('button', { name: /Masuk|Login/i });

    await emailInput.fill('fake-superadmin@frasaklausa.test');
    await passwordInput.fill('WrongPassword123!');
    await submitBtn.click();

    // Pastikan tidak tembus ke /admin
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });
});
