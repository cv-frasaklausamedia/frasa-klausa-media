# Catatan Keputusan Arsitektur & Asumsi — Frasa Klausa Media v1.0

Dokumen ini mendokumentasikan rekonsiliasi keputusan arsitektur (*Architecture Decision Records / ADR*) dan asumsi teknis yang telah dikonfirmasi dan diimplementasikan dari **Tahap 1 hingga Tahap 15** mengacu pada spesifikasi [PRD.md](file:///c:/Users/muhaz/OneDrive/Desktop/frasa-klausa-media/docs/PRD.md) dan [ROADMAP.md](file:///c:/Users/muhaz/OneDrive/Desktop/frasa-klausa-media/docs/ROADMAP.md).

---

## 1. Keputusan Fondasi & Framework

### ADR-01: Next.js 16 App Router & Turbopack
- **Keputusan:** Menggunakan Next.js 16.x dengan App Router (`src/app`) dan Turbopack bundler. Dilarang menggunakan Pages Router.
- **Rasional:** Performa rendering tercepat, dukungan Partial Prerendering (PPR), Server Actions bawaan, dan optimasi build production modern.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-02: React 19 Server Components by Default
- **Keputusan:** Menjadikan Server Component sebagai pilihan baku untuk semua layout dan halaman. Direktif `'use client'` hanya digunakan pada komponen yang memerlukan hook state React, browser APIs, atau event listeners.
- **Rasional:** Mengurangi ukuran JavaScript bundle yang dikirim ke browser klien, meningkatkan Core Web Vitals (LCP < 2.5s), dan memperkuat keamanan (database query dieksekusi langsung di server tanpa mengekspos endpoint API publik).
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-03: Tailwind CSS v4 (CSS-First Architecture)
- **Keputusan:** Menggunakan Tailwind CSS v4 dengan konfigurasi CSS-first (`@import "tailwindcss"` di `globals.css`) tanpa menghasilkan `tailwind.config.js` usang. Mengintegrasikan `@tailwindcss/typography` (`prose`) untuk artikel blog.
- **Rasional:** Generasi stylesheet instan via Rust compiler Tailwind v4, kompatibilitas Turbopack, dan pemeliharaan tema modern berbasis CSS variables.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-04: Penggunaan NPM Eksklusif
- **Keputusan:** Melarang penggunaan `pnpm` atau `yarn`; strictly menggunakan `npm` (`npm ci` pada CI/CD).
- **Rasional:** Mencegah konflik dependency tree pada `package-lock.json` dan menjaga determinisme build pada seluruh lingkungan (lokal, CI, dan Vercel).
- **Status:** Diimplementasikan & Dikonfirmasi.

---

## 2. Keputusan UI/UX & Interaksi

### ADR-05: Persistensi Status Sidebar Admin via Cookies
- **Keputusan:** Status ciut (*collapsed*) atau lebar (*expanded*) pada sidebar admin wajib disimpan menggunakan **browser cookies** (`sidebar_state`) yang dibaca secara server-side via `cookies()`, BUKAN melalui `localStorage`.
- **Rasional:** Menghilangkan fenomena tata letak berkedip (*Cumulative Layout Shift / CLS*) dan layout flicker saat pengguna me-refresh halaman dashboard.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-06: Sidebar Responsif Mobile (Slide-Out Drawer)
- **Keputusan:** Pada perangkat mobile (lebar layar < 768px), sidebar muncul sebagai laci off-canvas slide-out dari sisi kiri layar dengan tombol toggle hamburger di navbar.
- **Rasional:** Memaksimalkan area kerja konten tabel dan form pada layar smartphone.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-07: Pencarian Global Cepat via Command Dialog Modal (`Ctrl + K`)
- **Keputusan:** Menggunakan modal dialog `cmdk` (shadcn Command) yang dipicu oleh kombinasi tombol `Ctrl + K` (atau `Cmd + K` di macOS) dengan debounce 300ms pada pencarian server.
- **Rasional:** Pengunjung dapat mencari buku dan artikel blog secara instan dari halaman mana pun tanpa meninggalkan konteks halaman saat ini.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-08: Editor Konten Tiptap dengan Sanitasi Ketat
- **Keputusan:** Menggunakan editor teks kaya Tiptap (`@tiptap/react`) untuk penulisan artikel blog CMS, dan membersihkan seluruh output HTML-nya di server menggunakan sanitasi ketat (`src/lib/sanitizer.ts`).
- **Rasional:** Memberikan pengalaman penulisan yang kaya (heading, quote, link, bullet) bagi tim redaksi sambil secara absolut menangkal serangan Cross-Site Scripting (XSS).
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-09: Embed Peta Responsif Google Maps Iframe
- **Keputusan:** Menggunakan Google Maps Embed responsif (`<iframe>`) untuk halaman kontak publik pada v1.0, tanpa memasang pustaka peta berat seperti `maplibre-gl` atau `leaflet`.
- **Rasional:** Menghindari penambahan bundle size JavaScript hingga ratusan kilobyte hanya untuk menampilkan satu lokasi kantor penerbit.
- **Status:** Diimplementasikan & Dikonfirmasi.

---

## 3. Keputusan Bisnis & Logika Domain

### ADR-10: Multi-Channel Checkout dengan Fallback Otomatis
- **Keputusan:** Halaman detail buku menyediakan pemesanan multi-kanal: WhatsApp, Shopee, dan Tokopedia. Jika admin mengosongkan link Shopee atau Tokopedia untuk buku tertentu, tombol marketplace tersebut **otomatis disembunyikan (hidden)** dari halaman publik tanpa merusak tata letak.
- **Rasional:** Setiap buku mungkin memiliki ketersediaan yang berbeda di masing-masing kanal penjualan; mencegah pengunjung mengklik tombol yang mengarah ke link rusak/kosong.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-11: Dynamic Copyright Tahun Berjalan
- **Keputusan:** Footer publik menampilkan format copyright `[Company Name] © {currentYear}` secara dinamis menggunakan `React.useSyncExternalStore` (dengan fallback 2026 saat SSR).
- **Rasional:** Mencegah tahun copyright membeku pada hasil static build (SSG/ISR), sekaligus menjamin nol cascading render / hydration mismatch.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-12: Keep-Alive Cron Supabase
- **Keputusan:** Mengimplementasikan endpoint `/api/keep-alive` yang dipanggil setiap 5 hari via Vercel Cron untuk menjalankan kueri ringan (`SELECT 1`).
- **Rasional:** Mencegah basis data Supabase mengalami auto-pause akibat ketidakaktifan pada tier tertentu.
- **Status:** Diimplementasikan & Dikonfirmasi.

---

## 4. Keputusan Keamanan & Aksesibilitas

### ADR-13: Isolasi Autentikasi Pengelola (No Public Auth)
- **Keputusan:** Fitur autentikasi HANYA diperuntukkan bagi Administrator dan Super Administrator. Tidak ada pendaftaran atau login untuk pengunjung umum.
- **Rasional:** Frasa Klausa Media v1.0 adalah portal katalog penerbitan terkurasi dan blog literasi, bukan e-commerce multi-vendor atau media sosial berbasis user-generated content.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-14: Pembuatan Akun Baru Terpusat via Super Admin
- **Keputusan:** Pembuatan akun staf admin baru dilakukan langsung oleh Super Admin melalui modal CMS dengan email dan password sementara (memanfaatkan Supabase Auth Admin API server-side).
- **Rasional:** Menghilangkan ketergantungan pada setup server SMTP email eksternal di awal peluncuran sistem.
- **Status:** Diimplementasikan & Dikonfirmasi.

### ADR-15: Pengujian Berkecepatan Tinggi (Native Node.js Test Runner)
- **Keputusan:** Menjalankan 457 unit & integration tests menggunakan native test runner Node.js 22 (`node --test --experimental-strip-types`).
- **Rasional:** Seluruh suite pengujian selesai dieksekusi dalam waktu kurang dari **4 detik** tanpa memerlukan kompilasi Babel/Jest/ts-node yang lambat, mempercepat feedback loop CI/CD.
- **Status:** Diimplementasikan & Dikonfirmasi.

---

## 5. Batasan di Luar Scope Versi 1.0 (Non-Scope)

Sesuai konfirmasi PRD §26, fitur-fitur berikut **secara sengaja tidak dimasukkan ke dalam v1.0**:
1. Payment gateway checkout langsung di situs (pembayaran diproses via WhatsApp atau marketplace mitra).
2. Pengecekan status transaksi real-time menggunakan Server-Sent Events (SSE) atau WebSockets.
3. Login atau sistem keranjang belanja multi-item untuk pengunjung publik.
