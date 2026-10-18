# Panduan Pengembang (Developer Guide) — Frasa Klausa Media

Dokumen ini ditujukan bagi pengembang yang bekerja pada repositori **Website & CMS Frasa Klausa Media**. Panduan ini mencakup instruksi setup lokal, perintah operasional NPM, konvensi struktur folder, serta pedoman kontribusi dan keamanan.

---

## 1. Prasyarat Sistem

Sebelum memulai, pastikan sistem lokal Anda telah terpasang:
- **Node.js**: Versi `20.x` atau `22.x` LTS (disarankan Node v22.15+; Next.js 16 mewajibkan Node.js >= 20.9.0)
- **Framework**: **Next.js 16.x** (v16.4.x, App Router) + React 19.x / 19.2
- **Package Manager**: **NPM** (Versi 10+ / 11+). **Dilarang memakai pnpm atau yarn** untuk menjaga konsistensi `package-lock.json` sesuai PRD §4.1.

---

## 2. Langkah Setup Lokal

1. **Clone & Masuk ke Direktori Proyek**:
   ```bash
   git clone <repository-url>
   cd frasa-klausa-media
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin berkas template lingkungan ke berkas lokal:
   ```bash
   cp env.example .env.local
   ```
   Buka berkas `.env.local` dan isi nilainya sesuai proyek Supabase Anda:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase (misal: `https://xyz.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci anon publik Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Kunci service role admin (hanya untuk server-side)
   - `NEXT_PUBLIC_APP_URL`: URL root aplikasi (`http://localhost:3000`)

   > [!CAUTION]
   > Jangan pernah melakukan `git add` atau commit berkas `.env.local` ke repositori publik maupun private!

4. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

---

## 3. Daftar Perintah NPM

| Perintah | Deskripsi |
| :------- | :-------- |
| `npm run dev` | Menjalankan server pengembangan lokal Next.js dengan Hot Module Replacement (HMR). |
| `npm run build` | Melakukan kompilasi dan optimasi bundle production. |
| `npm run start` | Menjalankan server aplikasi production hasil kompilasi `build`. |
| `npm run lint` | Menjalankan analisis statis ESLint untuk memeriksa kualitas dan format kode. |
| `npm run typecheck` | Menjalankan kompilasi TypeScript (`tsc --noEmit`) secara strict tanpa menghasilkan berkas JS. |
| `npm run test` | Menjalankan suite pengujian unit/integrasi (placeholder untuk Tahap 14). |

---

## 4. Struktur Folder & Modularitas (PRD §4.5 & §19)

Struktur proyek diatur dengan disiplin modular tinggi:

```text
.
|-- docs/                 # Dokumentasi internal proyek (PRD, ROADMAP, README-dev)
|-- note/                 # Catatan diskusi dan referensi tim
|-- public/               # Aset statis (flag, logo, ikon)
|-- src/
|   |-- actions/          # Server Actions global (auth action, storage action, dsb.)
|   |-- app/              # Next.js App Router
|   |   |-- (admin)/      # Route group dashboard CMS admin (SSR, auth required)
|   |   |-- (auth)/       # Route group login admin/super admin
|   |   |-- (public)/     # Route group halaman pengunjung publik
|   |   |-- _components/  # Komponen scoped khusus route tertentu
|   |   `-- api/          # Internal route handlers API
|   |-- components/
|   |   |-- common/       # Komponen reusable antarmuka (theme toggle, breadcrumb helper)
|   |   `-- ui/           # Komponen primitif shadcn UI (button, dialog, card, dll.)
|   |-- configs/          # Konfigurasi aplikasi & validasi Zod environment
|   |-- constants/        # Nilai konstanta statis, daftar role, enum domain
|   |-- hooks/            # Custom React hooks
|   |-- lib/
|   |   |-- supabase/     # Inisialisasi Supabase client (client, server, middleware)
|   |   `-- utils.ts      # Utilitas umum (cn function)
|   |-- migrations/       # Berkas migrasi skema SQL Supabase bernomor urut
|   |-- providers/        # React context providers (ThemeProvider, ReactQueryProvider)
|   |-- stores/           # Global client state (Zustand)
|   |-- types/            # Definisi antarmuka TypeScript domain
|   |-- validations/      # Schema validasi Zod
|   `-- middleware.ts     # Next.js Edge Middleware untuk session sync Supabase
|-- env.example           # Contoh variabel lingkungan
|-- next.config.ts        # Konfigurasi Next.js (remote patterns Supabase)
|-- package.json          # Metadata & dependensi proyek
`-- tsconfig.json         # Konfigurasi TypeScript strict & alias @/*
```

---

## 5. Ringkasan Aturan Kontribusi & Kualitas Kode (PRD §21)

1. **Kebijakan Nol Kredensial (Zero-Secret Policy)**:
   - Dilarang keras melakukan commit terhadap `.env.local`, API secret, service role key, atau dump database sensitif.
   - Variabel `SUPABASE_SERVICE_ROLE_KEY` wajib dilindungi oleh penanda `import 'server-only'` di `src/configs/server-env.ts`.
2. **Kualitas TypeScript & Lint**:
   - Dilarang mematikan rule linting atau TypeScript (`@ts-ignore`, `eslint-disable`) hanya demi membuat pipeline CI hijau.
   - Hindari penggunaan tipe `any`. Gunakan tipe eksplisit, union, generic, atau parsing skema Zod.
3. **Standar Komponen UI**:
   - Gunakan komponen shadcn UI sebagai fondasi utama. Jangan membuat ulang kontrol dasar (button, input, modal) jika versi shadcn/Radix sudah tersedia.
   - Pertahankan konsistensi token semantik Tailwind untuk dukungan tema Light dan Dark mode tanpa hardcoding warna.
4. **Perubahan Skema Database**:
   - Seluruh perubahan skema Supabase wajib dibuat melalui berkas migrasi SQL baru di `src/migrations/` dengan format penomoran berurutan (`001_initial_schema.sql`, `002_...`).
   - Dilarang memodifikasi berkas migrasi yang sudah dirilis/diterapkan.
5. **Git Commit & Pull Request**:
   - Commit harus atomik dan mencantumkan pesan yang jelas.
   - Setiap PR harus memastikan `npm run lint`, `npm run typecheck`, dan `npm run build` sukses 100%.

---

## 6. Pedoman Kontrak Integrasi Lintas Teknologi

Berdasarkan matriks kompatibilitas di PRD §4.2.1, seluruh pengembang wajib mematuhi pola integrasi berikut:

1. **Next.js 16 + Supabase SSR**:
   - Fungsi `cookies()` dari `next/headers` bersifat asynchronous: `const cookieStore = await cookies();`.
   - Gunakan overload modern `createServerClient` dengan handler `getAll()` dan `setAll()`.
   - Pembacaan cookie pada Server Component aman dilakukan, sedangkan penulisan cookie (`setAll`) yang terpanggil dari Server Component wajib dibungkus blok `try/catch` (penulisan cookie utama dilakukan via Middleware atau Server Actions).

2. **Tailwind CSS v4 + shadcn/ui + next-themes**:
   - Jangan membuat berkas `tailwind.config.ts`.
   - `components.json` menggunakan `"tailwind": { "config": "", "css": "src/app/globals.css" }`.
   - Dark mode diatur via `next-themes` (mengubah atribut class pada `<html>`), dan didukung otomatis oleh `@custom-variant dark (&:is(.dark *));` di `globals.css`.

3. **Batas Client Component (*Client Boundaries*)**:
   - Editor Tiptap (`@tiptap/react`) dan Recharts mengakses objek browser (`window`, `document`, `ResizeObserver`).
   - Tiptap wajib di-load menggunakan `next/dynamic(() => import(...), { ssr: false })`.
   - Komponen chart Recharts wajib ditandai direktif `'use client'`.

4. **Validasi Formulir (React Hook Form + Zod)**:
   - Skema Zod disimpan di `src/validations/`.
   - Di client: dipasang ke form via `@hookform/resolvers/zod`.
   - Di server: wajib dieksekusi ulang (`schema.parse` / `safeParse`) di dalam Server Action sebelum data diproses ke database.

