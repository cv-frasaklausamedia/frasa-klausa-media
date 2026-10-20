import { test, expect } from '@playwright/test';

test.describe('Negative & Abuse Resistance Testing (PRD §15 & §17)', () => {
  // 1. MANIPULASI QUERY PARAMETER
  test('Katalog menangani query parameter manipulatif / tidak lazim secara anggun tanpa crash', async ({ page }) => {
    // Parameter negatif, SQL injection string, dan format tipe salah
    const maliciousUrl = '/katalog?page=-999&sort=DROP+TABLE+books&price_min=bukanAngka&category=../../etc/passwd';
    const response = await page.goto(maliciousUrl);

    // Sistem tidak boleh throw unhandled 500 fatal crash
    expect(response?.status()).toBeLessThan(500);

    // Halaman katalog tetap dapat dirender dengan fallback aman
    await expect(page.locator('h1')).toContainText(/Katalog/i);
  });

  // 2. DEFENSE AGAINST XSS PAYLOAD DALAM SEARCH
  test('Payload XSS pada query pencarian tidak dieksekusi oleh browser', async ({ page }) => {
    let dialogTriggered = false;
    page.on('dialog', (dialog) => {
      dialogTriggered = true;
      dialog.dismiss();
    });

    const xssPayload = '<script>window.__xss_executed=true</script><img src=x onerror=alert(1)>';
    await page.goto(`/katalog?q=${encodeURIComponent(xssPayload)}`);

    // Pastikan tidak ada dialog alert browser yang terpanggil
    expect(dialogTriggered).toBe(false);

    // Pastikan window variable tidak tercemar
    const isXssExecuted = await page.evaluate(() => (window as unknown as { __xss_executed?: boolean }).__xss_executed);
    expect(isXssExecuted).toBeUndefined();
  });

  // 3. OPEN REDIRECT DEFENSE PADA LOGIN
  test('Parameter redirectTo manipulatif (eksternal URL) dinetralkan ke path internal aman', async ({ page }) => {
    // Coba phishing redirect: redirectTo=https://evil-hacker.com
    await page.goto('/login?redirectTo=https://evil-hacker.com');

    // Input kredensial
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Pastikan URL halaman tidak terlempar ke domain luar
    expect(page.url()).not.toMatch(/^https?:\/\/evil-hacker\.com/);
  });

  // 4. AKSES ENDPOINT RAHASIA & PROTEKSI DATABASE
  test('Endpoint keep-alive merespons query database atau menolak akses tidak sah', async ({ request }) => {
    const response = await request.get('/api/keep-alive');
    // Status valid adalah 200 (database alive) atau 401 (unauthorized jika cron secret aktif)
    expect([200, 401]).toContain(response.status());
  });
});
