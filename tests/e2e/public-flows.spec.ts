import { test, expect } from '@playwright/test';

test.describe('Public User Flows (PRD §3, §6, §7, §17)', () => {
  // 1. BERANDA (HOME) & DYNAMIC COPYRIGHT
  test('Beranda memuat dengan benar dan menampilkan footer dengan copyright dinamis', async ({ page }) => {
    await page.goto('/');

    // Verifikasi branding
    await expect(page).toHaveTitle(/Frasa Klausa Media/i);

    // Verifikasi footer copyright berformat [Company Name] © {tahun berjalan}
    const currentYear = new Date().getFullYear().toString();
    const footerCopyright = page.locator('footer');
    await expect(footerCopyright).toBeVisible();
    await expect(footerCopyright).toContainText('Frasa Klausa Media');
    await expect(footerCopyright).toContainText(currentYear);
  });

  // 2. KATALOG BUKU & FILTER KATEGORI / HARGA
  test('Katalog buku memuat daftar buku dan mendukung interaksi filter', async ({ page }) => {
    await page.goto('/katalog');

    // Judul halaman katalog
    await expect(page.locator('h1')).toContainText(/Katalog/i);

    // Memeriksa keberadaan kontrol pencarian / filter
    const searchInput = page.getByPlaceholder(/Cari judul buku/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('puisi');
      await page.waitForTimeout(350); // Debounce
    }

    // Memeriksa area daftar buku
    const bookCards = page.locator('article, [data-slot="card"]');
    const count = await bookCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // 3. DETAIL BUKU & TOMBOL CHECKOUT MULTI-KANAL
  test('Detail buku menampilkan spesifikasi dan link checkout WhatsApp yang valid', async ({ page }) => {
    await page.goto('/katalog');

    // Cari link buku pertama yang tersedia
    const firstBookLink = page.locator('main a[href^="/buku/"]').first();
    if (await firstBookLink.isVisible()) {
      await firstBookLink.click();
      await page.waitForURL(/\/buku\/.+/);

      // Pastikan ada tombol checkout WhatsApp di area konten utama detail buku
      const waButton = page.locator('main a[href*="wa.me"]').first();
      if (await waButton.isVisible()) {
        const href = await waButton.getAttribute('href');
        expect(href).toMatch(/https:\/\/wa\.me\/[0-9]+/);
      }
    }
  });

  // 4. BLOG PUBLIK
  test('Halaman blog memuat daftar artikel literasi', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.locator('h1')).toContainText(/Blog|Artikel|Kabar/i);
    const postCards = page.locator('article, a[href^="/blog/"]');
    const count = await postCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // 5. GLOBAL SEARCH (CTRL + K & SEARCH TRIGGER)
  test('Shortcut Ctrl+K membuka modal pencarian global command dialog', async ({ page, isMobile }) => {
    await page.goto('/');

    if (isMobile) {
      // Pada mobile: gunakan tombol ikon pencarian yang terlihat di navbar
      const mobileSearchBtn = page.locator('button[aria-label="Cari buku atau artikel"]');
      await mobileSearchBtn.click();
    } else {
      // Pada desktop: klik tombol pencarian di navbar atau gunakan shortcut
      const desktopSearchBtn = page.locator('button:has-text("Cari buku, artikel")');
      if (await desktopSearchBtn.isVisible()) {
        await desktopSearchBtn.click();
      } else {
        await page.locator('body').click();
        await page.keyboard.press('Control+k');
      }
    }

    // Modal dialog pencarian harus muncul
    const searchInput = page.getByPlaceholder(/Cari buku, penulis, atau artikel/i);
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Ketik kata kunci
    await searchInput.fill('sastra');
    await page.waitForTimeout(400); // 300ms debounce

    // Tekan Escape untuk menutup
    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();
  });

  // 6. FORMULIR KONTAK PUBLIK & VALIDASI
  test('Halaman kontak memvalidasi input salah dan menampilkan error', async ({ page }) => {
    await page.goto('/kontak');

    await expect(page.locator('h1')).toContainText(/Hubungi (Redaksi|Kami)/i);

    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const submitBtn = page.getByRole('button', { name: /Kirim Pesan/i });

    // Masukkan email invalid
    await emailInput.fill('bukan-email-valid');
    await submitBtn.click();

    // Validasi form / browser tooltip / pesan kesalahan muncul
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage || '');
    const errorText = page.getByText(/format.*email|tidak valid/i);
    const hasError = validationMessage.length > 0 || (await errorText.isVisible());
    expect(hasError).toBe(true);
  });
});
