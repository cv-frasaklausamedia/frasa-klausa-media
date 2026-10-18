# E2E Testing Rules & Guidelines (Playwright)

Dokumen ini merangkum panduan teknis dan standar pengujian End-to-End (E2E) menggunakan **Playwright** (TypeScript) untuk project Next.js ini.

---

## 1. Direktori & Konfigurasi
- **Direktori Utama Tes**: Seluruh file spesifikasi pengujian E2E wajib ditempatkan di folder `e2e/` dengan ekstensi `.spec.ts` (misalnya `e2e/homepage.spec.ts`).
- **File Konfigurasi**: `playwright.config.ts`.
- **Port Aplikasi**: Project ini berjalan di port **3001** (`http://localhost:3001`). `baseURL` dan konfigurasi `webServer` Playwright secara default telah disesuaikan ke port 3001.

---

## 2. Cara Menjalankan Tes E2E

### A. Menjalankan Tes Otomatis (Headless)
```powershell
npm run test:e2e
```

### B. Menjalankan Tes dengan Tampilan Browser (Headed)
```powershell
npx playwright test --headed
```

### C. Menjalankan UI Mode Interaktif
```powershell
npx playwright test --ui
```

### D. Menjalankan File Spesifik
```powershell
npx playwright test e2e/homepage.spec.ts
```

### E. Melihat Laporan Hasil Uji (HTML Report)
```powershell
npx playwright show-report
```

---

## 3. Best Practices Penulisan Tes Playwright
1. **User-Facing Locators**: Utamakan selektor berbasis accessibility dan semantik daripada class CSS volatile:
   - `page.getByRole('button', { name: /simpan/i })`
   - `page.getByRole('link', { name: /katalog/i })`
   - `page.getByText('CV Frasa Klausa Media')`
   - `page.getByLabel('Judul Buku')`
2. **Web-First Assertions**: Selalu gunakan assertion asinkron yang memiliki auto-waiting:
   - `await expect(locator).toBeVisible()`
   - `await expect(page).toHaveURL(/katalog/)`
3. **Isolasi Pengujian**: Setiap tes harus berdiri sendiri (*independent*). Hindari dependensi antar urutan pengujian (*test order dependency*).
4. **Instalasi Browser**:
   Jika browser Chromium belum terpasang di environment baru:
   ```powershell
   npx playwright install chromium
   ```
