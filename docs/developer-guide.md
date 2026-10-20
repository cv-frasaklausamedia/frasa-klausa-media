# Panduan Pengembang (Developer Guide) — Frasa Klausa Media v1.0

Dokumen ini adalah referensi teknis arsitektur, konvensi kode, alur kerja pengujian, serta pedoman kontribusi untuk repositori **Platform Web & CMS Frasa Klausa Media**.

Referensi PRD: **§4 (Teknologi & Dependensi)**, **§19 (Arsitektur & Struktur File)**, **§20 (Standar Kode)**, **§21 (Git & Code Review)**, **§22 (CI/CD)**, dan **§25 (Checklist Sebelum Selesai)**.

---

## 1. Prasyarat Sistem & Konvensi Package Manager

- **Runtime:** Node.js `22.x` LTS (disarankan v22.12+)
- **Framework:** **Next.js 16.x** (v16.4.x, App Router, Turbopack)
- **UI Engine:** **React 19.x** (Server Components by default)
- **Styling:** **Tailwind CSS v4** (CSS-first, `@tailwindcss/typography`)
- **Backend / Database:** **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL dengan RLS)
- **Package Manager:** **NPM** secara ketat. Dilarang menggunakan `pnpm` atau `yarn` untuk menjaga determinisme `package-lock.json`.

---

## 2. Struktur Folder & Modularitas Proyek

```text
frasa-klausa-media/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI/CD pipeline (lint, typecheck, audit, test, build, e2e)
├── docs/                          # Dokumentasi resmi proyek (PRD, ROADMAP, deploy, admin-guide, dll.)
├── public/                        # Aset statis publik (ikon, gambar default, favicon)
├── src/
│   ├── actions/                   # Server Actions Next.js (buku, blog, banner, kontak, auth, akun)
│   ├── app/                       # App Router Next.js 16
│   │   ├── (admin)/               # Route group CMS admin (terproteksi auth, persistent layout)
│   │   ├── (auth)/                # Route group autentikasi (/login)
│   │   ├── (public)/              # Route group halaman pengunjung publik (SSR/PPR)
│   │   ├── api/                   # Route Handlers (/api/keep-alive, /api/health, /api/search)
│   │   ├── robots.ts              # Konfigurasi robots.txt dinamis
│   │   └── sitemap.ts             # XML Sitemap generator dinamis
│   ├── components/
│   │   ├── admin/                 # Komponen khusus antarmuka CMS admin (sidebar, navbar, table)
│   │   ├── common/                # Komponen bersama (dynamic-copyright, theme-toggle)
│   │   ├── public/                # Komponen halaman publik (katalog-filter, checkout, command-dialog)
│   │   └── ui/                    # Komponen primitif shadcn UI (button, dialog, input, card, dll.)
│   ├── constants/                 # Konstanta identitas resmi, metadata default, enum domain
│   ├── lib/
│   │   ├── accounts/              # Service & data access akun administrator
│   │   ├── audit/                 # Append-only audit logger service
│   │   ├── auth/                  # Guard otorisasi, validasi peran, & helper profil
│   │   ├── banners/               # Service & komputasi jadwal aktif banner promo
│   │   ├── books/                 # Service, RPC atomic, & query katalog buku
│   │   ├── inquiries/             # Service & validasi inbox kontak
│   │   ├── posts/                 # Service artikel blog & hitung waktu baca
│   │   ├── rate-limit/            # Sliding window / fixed window rate limiter
│   │   ├── seo/                   # Generator Schema.org JSON-LD (Book, Article, Breadcrumb)
│   │   ├── site-content/          # Key-value site content data access
│   │   ├── supabase/              # Inisialisasi client Supabase (browser, server, middleware, public)
│   │   ├── action-response.ts     # Format baku respon Server Action { ok, data } / { ok, error }
│   │   ├── logger.ts              # Structured JSON logger
│   │   ├── sanitizer.ts           # XSS HTML sanitization engine
│   │   └── utils.ts               # Utilitas cn (clsx + tailwind-merge)
│   ├── migrations/                # Berkas SQL migrasi skema database bernomor urut
│   ├── types/                     # Definisi tipe antarmuka TypeScript domain
│   ├── validations/               # Skema validasi Zod untuk seluruh formulir & query
│   └── middleware.ts              # Edge Middleware untuk sinkronisasi sesi Supabase & route guards
├── tests/                         # Suite pengujian unit & integrasi native Node.js runner
│   └── e2e/                       # Pengujian End-to-End berbasis Playwright
├── env.example                    # Template variabel lingkungan
├── next.config.ts                 # Konfigurasi Next.js (CSP, HSTS, remote patterns Supabase)
├── playwright.config.ts           # Konfigurasi Playwright E2E
├── package.json
└── tsconfig.json
```

---

## 3. Konvensi Server Actions & Penanganan Error Aman

Setiap mutasi data wajib menggunakan **Next.js Server Action** (`'use server'`) dengan kontrak respon terstandarisasi:

```ts
import { actionSuccess, handleActionError, type ActionResponse } from '@/lib/action-response';

export async function submitExampleAction(formData: FormData): Promise<ActionResponse<MyData>> {
  try {
    // 1. Otorisasi peran
    const user = await requireAdmin();

    // 2. Validasi input via Zod
    const validated = mySchema.parse(inputData);

    // 3. Eksekusi logika bisnis / kueri database
    const result = await myService.execute(validated);

    // 4. Return respon sukses terstandarisasi
    return actionSuccess(result);
  } catch (error) {
    // 5. Sanitasi error aman (tidak membocorkan SQL/stack trace)
    return handleActionError(error, 'submitExampleAction');
  }
}
```

### Struktur Respon Baku:
- **Sukses:** `{ ok: true, data: T }`
- **Gagal:** `{ ok: false, error: { message: string, code: string, status: number, fieldErrors?: Record<string, string[]> } }`

---

## 4. Keamanan & Sanitasi Input

1. **Anti-XSS:** Seluruh konten HTML yang berasal dari rich text editor Tiptap atau input bebas wajib melewati `sanitizeBookHtml`, `sanitizePostHtml`, atau `sanitizeSiteNarrativeHtml` di `src/lib/sanitizer.ts`.
2. **Anti Open-Redirect:** Parameter URL redirect setelah login wajib divalidasi menggunakan `getSafeRedirectUrl` di `src/lib/auth/redirect.ts`.
3. **Upload Gambar:**
   - Ukuran cover buku dibatasi maksimum **2MB**.
   - Validasi jenis file memeriksa ekstensi serta **magic bytes** (header biner file) untuk mencegah file berbahaya menyamar sebagai gambar.
4. **Honeypot & Rate Limit:**
   - Form kontak publik menyertakan field bot-trap `hp_field` yang disembunyikan via CSS. Jika terisi, pengiriman ditolak langsung.
   - Rate limit IP membatasi frekuensi pengiriman formulir publik (5 pesan per IP/email per jam).

---

## 5. Alur Kerja Pengujian & Kualitas Kode

Perintah operasional standar:

```bash
# 1. Analisis statis linter (Zero ESLint error)
npm run lint

# 2. Pemeriksaan tipe TypeScript strict
npm run typecheck

# 3. Pengujian Unit & Integrasi (457 test suites berbasis native Node.js test runner)
npm test

# 4. Pengujian dengan cakupan code coverage
npm run test:coverage

# 5. Kompilasi build produksi (Turbopack)
npm run build

# 6. Audit keamanan dependensi
npm audit --audit-level=critical

# 7. Pengujian End-to-End Playwright
npm run test:e2e
```

> [!IMPORTANT]
> **Aturan CI/CD & Code Review (PRD §21):**
> Dilarang menonaktifkan aturan lint, typecheck, atau tes unit demi membuat pipeline CI hijau. Setiap Pull Request wajib meloloskan workflow `.github/workflows/ci.yml` secara penuh sebelum dimerge ke `main`.
