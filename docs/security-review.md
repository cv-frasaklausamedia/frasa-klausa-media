# Laporan Review Keamanan, Keep-Alive, & Observability (Tahap 13)

**Proyek:** Website & CMS Frasa Klausa Media  
**Tanggal:** 2026-10-20  
**Acuan:** `PRD.md` §14.6, §15, §16.7, §18 & `ROADMAP.md` Tahap 13  
**Status:** ✅ Lolos Seluruh Checklist / Production-Ready  

---

## 1. Ringkasan Eksekutif

Tahap 13 telah menyelesaikan pengerasan sistem (*security hardening*), implementasi rute anti auto-pause Supabase (*keep-alive*), integrasi *structured JSON logging* dengan redaksi otomatis, serta audit komprehensif terhadap 13 sub-bab keamanan web (PRD §15).

Semua 404 automated tests unit dan integrasi dinyatakan **LULUS (100% pass)** tanpa error maupun kebocoran informasi kredensial.

---

## 2. Anti Auto-Pause (Keep-Alive) & Vercel Cron

### 2.1 Implementasi Route Handler
- **Endpoint:** `GET /api/keep-alive` (`src/app/api/keep-alive/route.ts`)
- **Query Basis Data:** Mengeksekusi satu query baca sangat ringan menggunakan Supabase Admin Client:
  ```typescript
  await supabase.from('site_settings').select('key').limit(1).maybeSingle();
  ```
  Menghasilkan aktivitas I/O minimal yang mencukupi untuk mencegah auto-pause gratis Supabase tanpa membebani pool koneksi Postgres.
- **Proteksi Akses (Defense-in-Depth):**
  1. **Verifikasi Bearer Token:** Memvalidasi header `Authorization: Bearer <CRON_SECRET>`. Request ditolak dengan kode `401 Unauthorized` jika token tidak ada, salah, atau bertipe non-Bearer.
  2. **Rate Limiting:** Menggunakan driver in-memory/Supabase rate limiter dengan ambang batas 10 request per 5 menit per IP untuk mencegah serangan flooding.
  3. **Anti-Caching Total:** Menetapkan header `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`, `Pragma: no-cache`, `Expires: 0`, dan `Surrogate-Control: no-store` serta konfigurasi Next.js route segment `export const dynamic = 'force-dynamic'`.
  4. **Respons Minimal:** Mengembalikan `{ ok: true, timestamp: "..." }` tanpa detail tabel, latency internal yang sensitif, atau stack trace.

### 2.2 Konfigurasi Vercel Cron (`vercel.json`)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/keep-alive",
      "schedule": "0 3 */5 * *"
    }
  ]
}
```
> **Catatan Interval Cron:**  
> Ekspresi `"0 3 */5 * *"` menjalankan cron setiap 5 hari (pukul 03:00 UTC pada tanggal 1, 6, 11, 16, 21, 26, dan 31).  
> Karena `"*/5"` pada kolom hari-dalam-bulan mereset di awal bulan kalender baru, interval antara tanggal 31 ke tanggal 1 berikutnya bisa berkisar 1 hari. Ini sepenuhnya **dapat diterima dan menguntungkan**, karena memastikan proyek Supabase tetap aktif dan intervalnya selalu berada jauh di bawah ambang batas auto-pause Supabase (~7 hari inaktivitas).

---

## 3. Structured Logging Terstandarisasi (`src/lib/logger`)

### 3.1 Format JSON Terstruktur (PRD §16.7)
Format log JSON memuat konteks yang seragam:
- `timestamp`: Format ISO 8601 UTC.
- `level`: `debug` | `info` | `warn` | `error`.
- `service`: `frasa-klausa-media`.
- `environment`: `production` | `development`.
- `requestId`: UUID pelacak request/korelasi unik.
- `route` / `action`: Nama route handler atau Server Action.
- `status`: HTTP status code (misal 200, 401, 429, 500).
- `durationMs`: Durasi eksekusi dalam milidetik.
- `actorId`: ID pengguna non-sensitif (UUID).
- `metadata`: Data kontekstual ter-redaksi.
- `error`: Detail error yang aman tanpa stack trace di production.

### 3.2 Redaksi Otomatis Data Sensitif & PII
Fungsi `redactSensitiveData` bekerja secara rekursif memeriksa objek, array, dan header HTTP. Kunci-kunci berikut otomatis diubah menjadi `[REDACTED]`:
- Password / sandi (`password`, `new_password`, `currentPassword`)
- Token otentikasi (`token`, `access_token`, `refresh_token`, `sessionToken`)
- Secret & Key (`secret`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `apiKey`)
- Header otorisasi & cookie (`authorization`, `cookie`, `session`, `bearer`)
- Data kartu pembayaran (`credit_card`, `card_number`)
- String bearer token di tengah teks diubah menjadi `Bearer [REDACTED]`
- Proteksi terhadap circular reference (`[CIRCULAR]`) dan pembatasan panjang teks maksimal 1000 karakter (`...[TRUNCATED]`).

### 3.3 Penerapan pada Handler & Action Kritis
1. **Otentikasi (`src/actions/auth.ts`):** Mencatat login berhasil, kegagalan kredensial, proteksi brute-force (429), dan logout tanpa mencatat password mentah.
2. **Pencarian Publik (`src/app/api/search/route.ts`):** Mencatat kata kunci, durasi RPC Supabase, rate limit, dan jumlah hasil pencarian.
3. **Formulir Kontak Publik (`src/actions/inquiry.ts`):** Mencatat submisi pesan masuk, status penanganan inbox admin, dan penghapusan data.
4. **Mutasi Data & Unggah Media (`book.ts`, `post.ts`, `profile.ts`, `site-content.ts`):** Mencatat pengunggahan avatar/cover/galeri dengan MIME type kanonikal serta pembersihan file yatim (*orphan storage rollback*).
5. **Keep-Alive (`src/app/api/keep-alive/route.ts`):** Mencatat keberhasilan ping database berkala.

---

## 4. Observability & Klasifikasi Error (`src/lib/monitoring.ts`)

Untuk mencegah alert fatik (*noisy alerts*), error diklasifikasikan secara ketat menjadi dua kelompok:

| Kategori Error | Contoh Kasus | Penanganan & Severity |
| :--- | :--- | :--- |
| **Expected Error (Operasional)** | Validasi form Zod (422), Kredensial salah (401), Role tidak cukup (403), Data tidak ditemukan (404), Slug duplikat (409), Rate limit terlampaui (429). | Dicatat dengan level `WARN` (`isExpected: true`). **Tidak memicu pager alert ke developer.** |
| **Unexpected Error (Insiden)** | Database connection loss, crash runtime tak terduga, sintaks query invalid, 500 status. | Dicatat dengan level `ERROR` (`isExpected: false`) dan diteruskan ke error tracking stack (Sentry/Datadog/Logtail). |

### Metrik yang Dipantau:
1. **Error Rate:** Rasio request 5xx terhadap total request (target < 0.1%).
2. **Latency (p95 & p99):** Durasi p95 < 500ms untuk Server Actions dan < 150ms untuk API pencarian & keep-alive.
3. **Database Query Lambat:** Query yang memakan waktu > 500ms otomatis tercatat di log durasi.
4. **Auth Failure Spike:** Percobaan login berulang yang memicu status 401/429 dipantau sebagai indikasi serangan brute-force.
5. **Rate Limit Hits (429):** Memantau IP yang sering melanggar batas rate limiting pencarian atau formulir kontak.

---

## 5. Checklist Tinjauan Keamanan (PRD §15)

### 5.1 Secret & Environment Variable (§15.1)
- [x] `.env.local` terdaftar dalam `.gitignore` dan tidak masuk Git.
- [x] `env.example` hanya berisi placeholder non-sensitif (`your-project.supabase.co`, `your-random-cron-secret-here`).
- [x] Seluruh variabel berawalan `NEXT_PUBLIC_` diaudit: hanya `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_APP_URL`. Tidak ada secret/service role key pada variabel client.
- [x] `SUPABASE_SERVICE_ROLE_KEY` dan `CRON_SECRET` dilindungi menggunakan modul `'server-only'` (`src/configs/server-env.ts`).

### 5.2 Authentication & Session (§15.2)
- [x] Verifikasi session server-side di setiap Server Action sensitif (`requireAdmin()` / `requireSuperAdmin()`).
- [x] Cookie auth dikelola oleh `@supabase/ssr` dengan atribut `HttpOnly`, `SameSite=Lax`, dan `Secure` (pada production).
- [x] Pengecekan status keaktifan akun (`is_active = true`) langsung di basis data pada saat login dan pemanggilan action.

### 5.3 Authorization (§15.3)
- [x] Prinsip *deny-by-default*: Server Component dan Server Actions tidak mempercayai parameter role dari client.
- [x] Row-Level Security (RLS) terpasang di semua tabel database Supabase.
- [x] Audit log append-only mencatat identitas actor (UUID), aksi, target, dan status secara aman di database (`src/lib/audit/logger.ts`).

### 5.4 Validasi Input (§15.4)
- [x] Seluruh input formulir dan parameter URL divalidasi menggunakan skema Zod di server.
- [x] Parameter pengurutan, pagination, dan enum status dibatasi dengan allowlist ketat.
- [x] Tidak ada raw query SQL dengan konkatenasi string pengguna; seluruh interaksi memakai parameter binding PostgREST / RPC Supabase.

### 5.5 XSS & Content Injection (§15.5)
- [x] Bebas dari `dangerouslySetInnerHTML` berbahaya pada data publik.
- [x] Output HTML dari Tiptap rich-text editor disanitasi menggunakan `sanitize-html` (`src/lib/sanitizer.ts`) dengan allowlist tag teks (`p`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `a`, `img`) dan skema URL aman (`http`, `https`, `mailto`).

### 5.6 CSRF (§15.6)
- [x] Mutasi data menggunakan Next.js Server Actions dengan verifikasi Host/Origin header bawaan Next.js.
- [x] Cookie sesi dikonfigurasi dengan `SameSite=Lax`.
- [x] Tidak ada operasi mutasi data yang menggunakan HTTP request `GET`.

### 5.7 SSRF & External URL (§15.7)
- [x] Server Next.js tidak melakukan `fetch()` ke URL sembarang dari input pengguna.
- [x] Tautan checkout marketplace (Shopee, Tokopedia, WhatsApp) disimpan sebagai data string statis dan hanya dirender sebagai tag hyperlink `<a href="..." target="_blank" rel="noopener noreferrer">` di browser pengguna.

### 5.8 File Upload (§15.8)
- [x] Batas ukuran berkas diverifikasi sebelum diproses (Avatar 2MB, Cover/Galeri Buku 5MB, Hero 3MB).
- [x] Validasi konten biner nyata (*magic bytes* via `validateImageMagicBytes` pada buffer byte pertama) untuk memastikan berkas asli berupa JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), atau WebP (`RIFF....WEBP`).
- [x] Nama berkas asli ditolak; nama objek penyimpanan dibuat menggunakan UUID v4 acak (`crypto.randomUUID()`).
- [x] *Storage Rollback*: Jika penyimpanan data ke basis data gagal, berkas yang baru diunggah langsung dihapus kembali dari Supabase Storage.

### 5.9 Security Headers & Content Security Policy (CSP) (§15.9)
- [x] Dikonfigurasikan di `next.config.ts`:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline'` (`'unsafe-eval'` dinonaktifkan di production)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com`
  - `font-src 'self' data: https://fonts.gstatic.com`
  - `connect-src 'self' https://*.supabase.co wss://*.supabase.co`
  - `frame-src 'self' https://www.google.com https://maps.google.com` (Google Maps Embed)
  - `frame-ancestors 'none'` (Anti-Clickjacking)
  - `object-src 'none'`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Production HTTPS)

### 5.10 CORS (§15.10)
- [x] Tidak ada wildcard `Access-Control-Allow-Origin: *` pada endpoint private/admin.
- [x] Seluruh komunikasi admin dan mutasi berjalan sesama origin (*same-origin*).

### 5.11 Rate Limiting & Abuse Prevention (§15.11)
- [x] Rate limiting otentikasi: 5 percobaan / 15 menit per kombinasi IP + Email.
- [x] Rate limiting reset akun: 3 percobaan / 15 menit.
- [x] Rate limiting kontak inquiry: 5 submisi / 15 menit per IP + Email dengan proteksi honeypot anti-bot.
- [x] Rate limiting pencarian global: 30 request / menit per IP.
- [x] Rate limiting keep-alive: 10 request / 5 menit per IP.

### 5.12 Error Handling & Information Disclosure (§15.12)
- [x] Pesan otentikasi login generik: *"Email atau kata sandi tidak valid."* (mencegah enumerasi akun pengguna).
- [x] Error PostgREST dan database internal diterjemahkan ke bahasa yang ramah pengguna tanpa membocorkan nama tabel, constraint, atau query mentah.
- [x] Stack trace tidak pernah dikirimkan ke antarmuka pengguna client.

### 5.13 Dependency & Supply Chain (§15.13)
- [x] Lockfile `package-lock.json` di-commit secara deterministik.
- [x] Analisis `npm audit`:
  - Advisory `@tiptap/core` (DOM mergeAttributes): Terisolasi pada CMS admin yang hanya dapat diakses oleh admin terotentikasi. Seluruh HTML yang dihasilkan disanitasi ulang di server sebelum disimpan dan sebelum dirender.
  - Advisory `postcss-selector-parser` dan `braces`: Dependensi tooling/build-time dev (`@tailwindcss/typography` dan `eslint-config-next`), tidak terekspos pada runtime server production.
- [x] Tidak ada temuan kerentanan *Critical*.

---

## 6. Hasil Verifikasi & Pengujian

### 6.1 Ringkasan Pengujian Otomatis
```bash
npm test
```
```text
# tests 404
# suites 104
# pass 404
# fail 0
# cancelled 0
# skipped 0
# duration_ms ~3027ms
```

### 6.2 Status TypeScript Typecheck
```bash
npm run typecheck
```
```text
> tsc --noEmit
Exit Code: 0 (No Type Errors)
```

---

## 7. Kesimpulan & Status Definition of Done (DoD)

- [x] **Cron terdaftar:** `vercel.json` berhasil dikonfigurasikan dengan jadwal `"0 3 */5 * *"` mengarah ke `/api/keep-alive`.
- [x] **Endpoint sah:** `/api/keep-alive` hanya merespons panggilan sah dengan header `Authorization: Bearer <CRON_SECRET>`, dilindungi rate limiting, dan anti-caching.
- [x] **Structured Logging & Redaction:** Teruji dengan sampel; informasi rahasia (password, token, cookie, secret) otomatis diredaksi.
- [x] **Error Classification:** Expected vs unexpected errors dibedakan agar monitoring tidak bising.
- [x] **Hardening Checklist:** Seluruh 13 poin PRD §15 telah diaudit dan dipenuhi secara menyeluruh. Tidak ada temuan keamanan kritis tersisa.
