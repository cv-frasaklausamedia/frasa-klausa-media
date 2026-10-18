# ROADMAP — Website & CMS Frasa Klausa Media

**Acuan:** `PRD.md` v1.0 (Approved / Ready for Implementation)
**Dibuat:** 2026-10-18
**Cara pakai:** kerjakan tahap secara berurutan. Setiap tahap punya **Prompt** yang bisa langsung disalin ke coding agent (Claude Code, Cursor, dsb.). Jangan lompat ke tahap berikutnya sebelum **Definition of Done (DoD)** tahap sekarang terpenuhi.

---

## Daftar Isi

- [Ringkasan Tahapan](#ringkasan-tahapan)
- [Prompt Konteks Global (wajib disisipkan di awal setiap sesi)](#prompt-konteks-global)
- [Catatan Keputusan & Asumsi](#catatan-keputusan--asumsi)
- [Tahap 0 — Fondasi Proyek](#tahap-0--fondasi-proyek)
- [Tahap 1 — Database, RLS & Storage](#tahap-1--database-rls--storage)
- [Tahap 2 — Auth, Authorization & Keamanan Inti](#tahap-2--auth-authorization--keamanan-inti)
- [Tahap 3 — Shell Admin (Sidebar, Navbar, Dashboard, Profil)](#tahap-3--shell-admin-sidebar-navbar-dashboard-profil)
- [Tahap 4 — CMS Kategori](#tahap-4--cms-kategori)
- [Tahap 5 — CMS Buku](#tahap-5--cms-buku)
- [Tahap 6 — CMS Blog](#tahap-6--cms-blog)
- [Tahap 7 — Banner Promo & Page CMS](#tahap-7--banner-promo--page-cms)
- [Tahap 8 — Manajemen Akun & Pengaturan (Super Admin)](#tahap-8--manajemen-akun--pengaturan-super-admin)
- [Tahap 9 — Layout Publik (Banner, Navbar, Footer, Search)](#tahap-9--layout-publik-banner-navbar-footer-search)
- [Tahap 10 — Halaman Publik: Beranda, Katalog, Detail Buku](#tahap-10--halaman-publik-beranda-katalog-detail-buku)
- [Tahap 11 — Halaman Publik: Blog, Tentang Kami, Kontak](#tahap-11--halaman-publik-blog-tentang-kami-kontak)
- [Tahap 12 — SEO, Performa & Aksesibilitas](#tahap-12--seo-performa--aksesibilitas)
- [Tahap 13 — Keep-Alive, Logging & Hardening](#tahap-13--keep-alive-logging--hardening)
- [Tahap 14 — Testing](#tahap-14--testing)
- [Tahap 15 — CI/CD, Deploy & Serah Terima](#tahap-15--cicd-deploy--serah-terima)
- [Checklist Akhir v1.0](#checklist-akhir-v10)

---

## Ringkasan Tahapan

| # | Tahap | Fokus | Bergantung pada |
| :- | :---- | :---- | :-------------- |
| 0 | Fondasi Proyek | Init Next.js, dependency, struktur folder, tema, shadcn | — |
| 1 | Database, RLS & Storage | Migrasi `001_...`, RLS, bucket, seed | 0 |
| 2 | Auth, Authorization & Keamanan Inti | Supabase client, `proxy.ts`, role helper, rate limit, headers | 1 |
| 3 | Shell Admin | Sidebar (cookie + mobile), navbar, dashboard, profil | 2 |
| 4 | CMS Kategori | CRUD + tabel server-side | 3 |
| 5 | CMS Buku | CRUD, upload cover/galeri, rich text, checkout link | 4 |
| 6 | CMS Blog | CRUD, rich text, SEO meta | 4 |
| 7 | Banner & Page CMS | Banner berjadwal, Hero, Tentang, Kontak/sosmed | 3 |
| 8 | Akun & Pengaturan | Undang admin, aktif/nonaktif, reset, settings | 3 |
| 9 | Layout Publik | Sticky banner, navbar, footer, search global | 5, 6, 7 |
| 10 | Publik: Beranda, Katalog, Detail Buku | Halaman utama + checkout multi-kanal | 9 |
| 11 | Publik: Blog, Tentang, Kontak | Sisa halaman publik | 9 |
| 12 | SEO, Performa & A11y | Metadata, JSON-LD, sitemap, CWV, WCAG AA | 10, 11 |
| 13 | Keep-Alive, Logging & Hardening | Cron 5 hari, structured log, audit | 2 |
| 14 | Testing | Unit, integrasi, RLS, e2e | semua |
| 15 | CI/CD, Deploy & Serah Terima | Pipeline, Vercel, UAT | 14 |

> Tahap 4–8 (admin) dan Tahap 9–11 (publik) boleh dikerjakan paralel oleh orang berbeda setelah Tahap 3 selesai, selama kontrak data/skema dari Tahap 1 sudah stabil.

---

## Prompt Konteks Global

Sisipkan blok ini **di awal setiap sesi/tahap** agar agent selalu patuh pada PRD. Prompt di tiap tahap di bawah mengasumsikan blok ini sudah ada.

```text
Kamu adalah coding agent senior untuk proyek "Website & CMS Frasa Klausa Media".
Sumber kebenaran: file PRD.md di root/docs proyek. Baca bagian PRD yang disebut
di tiap tugas sebelum menulis kode. Baca juga struktur & pola kode yang sudah ada
sebelum membuat implementasi baru.

ATURAN WAJIB (ringkasan PRD):
- Stack: Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 +
  shadcn/ui (Radix) + Supabase (Postgres, Auth, Storage, RLS) + Vercel.
- Package manager: HANYA NPM (jangan pnpm/yarn). Commit package-lock.json.
- Seluruh UI memakai komponen shadcn. Jangan buat ulang primitive yang sudah ada.
  Pakai satu set ikon secara konsisten: lucide-react (Keputusan #10).
- Server Component adalah default. Tambah 'use client' hanya jika benar-benar perlu
  dan batasi sekecil mungkin.
- Struktur folder mengikuti PRD §4.5 dan §19. Alias import "@/*".
  Dilarang membuat folder seperti utils2/misc/temp.
- Validasi dengan zod (client untuk UX, SERVER wajib). Form: react-hook-form.
- Authentication & authorization dicek di server pada setiap action/handler/query
  sensitif. Route group, layout, atau tombol disabled BUKAN kontrol keamanan.
- Hindari any, @ts-ignore, lint-disable, dan type assertion pelindung data
  yang belum divalidasi. Parse data eksternal sebelum dipercaya.
- Hindari select('*') untuk data sensitif; pilih kolom eksplisit.
- Jangan pernah mengekspos SUPABASE_SERVICE_ROLE_KEY ke client, log, atau response.
- Jangan hardcode warna di luar semantic token; uji light & dark mode.
- Perubahan skema DB HANYA lewat migration baru bernomor urut di src/migrations
  (001_, 002_, ...). Jangan edit migration yang sudah dipakai.
- Jangan menambah dependency baru jika kebutuhan bisa dipenuhi paket yang sudah
  ada; jika terpaksa, jelaskan alasan, alternatif, dan dampak bundle.
- Setiap list/tabel/chart wajib punya loading, empty, dan error state.
- Tabel: default 10 baris/halaman (opsi 25/50/100), pagination shadcn,
  page/pageSize sinkron dengan URL.
- Prioritas keputusan bila konflik: keamanan & integritas data > business logic >
  privasi & authorization > reliability > accessibility > performa >
  maintainability > konsistensi UI > kecepatan.

CARA KERJA:
1. Ringkas rencana singkat (file yang akan dibuat/diubah) sebelum coding.
2. Implementasikan secara bertahap dan sebisa mungkin kecil-kecil.
3. Jalankan: npm run lint, npm run typecheck (atau tsc --noEmit), npm run build.
4. Akhiri dengan ringkasan: apa yang dibuat, trade-off/keputusan, hal yang belum
   dikerjakan, dan cara mengujinya. Jangan menyatakan selesai hanya karena UI
   terlihat benar; periksa state error, permission, loading, dan edge case.
```

---

## Catatan Keputusan & Asumsi

Hal-hal berikut merupakan **keputusan final** hasil klarifikasi PRD:

| # | Topik | Keputusan Final |
| :- | :---- | :-------------- |
| 1 | Framework & Routing | **Next.js 16.x (App Router) + React 19** dan menggunakan **`src/middleware.ts`** (standar Next.js Edge untuk session auth Supabase). Provider tema tunggal: **`next-themes`**. |
| 2 | Rich Text Editor | Menggunakan **Tiptap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`) + Tailwind Typography (`prose`) dan sanitasi HTML (`isomorphic-dompurify`). |
| 3 | Peta Lokasi | Di v1.0, gunakan **Google Maps Embed responsif / link resmi + Alamat Fisik Terverifikasi**, tanpa dependensi berat `maplibre-gl` untuk menjaga bundle size dan Core Web Vitals. |
| 4 | Form Kontak & Inbox | Pesan disimpan ke tabel Supabase **`contact_inquiries`** (dengan rate limit IP & honeypot). Sediakan halaman **Inbox Pesan di CMS Admin** untuk memfilter status (`unread`, `replied`, `archived`). |
| 5 | Fallback Marketplace | Tombol Shopee atau Tokopedia yang link-nya kosong otomatis **disembunyikan (hidden)** agar tampilan buku rapi dan tidak menimbulkan dead click. |
| 6 | Format WhatsApp Order | Template pesan baku: `Halo Frasa Klausa Media, saya ingin memesan buku "[Judul Buku]" seharga [Harga]. Apakah stok masih tersedia?` (Fallback nomor resmi: `0813-8060-4256`). |
| 7 | Pencarian Global | Menggunakan **Command Dialog (shadcn `Command` / `cmdk`) modal dengan shortcut `Ctrl + K`** dan klik ikon search navbar, dengan debounce 300ms untuk preview buku & blog instan. |
| 8 | Manajemen Akun Admin | Super Admin membuat akun admin baru dengan menginput **Email + Password Sementara** langsung di modal CMS via Server Action (`supabase.auth.admin.createUser()`), akun langsung aktif. |
| 9 | Struktur Kategori | Kategori buku (`book_categories`) dan kategori blog (`blog_categories`) dipisahkan menjadi dua tabel tersendiri. Penulis blog memakai kolom teks `author_name` (default nama admin, editable). |
| 10 | Standar Ikon Tunggal | Menggunakan **`lucide-react`** secara konsisten di seluruh antarmuka publik dan CMS Admin (standar shadcn/ui dan kompatibel langsung dengan referensi tema). |
| 11 | Pasangan Tipografi | Menggunakan pasangan **`Plus Jakarta Sans`** (UI, body text, form) dan **`Newsreader`** (heading literasi, judul buku, artikel) via `next/font/google`. |
| 12 | Relasi Blog & Katalog | Modul **Artikel Blog dan Katalog Buku dipisahkan sepenuhnya** (tabel dan halaman berdiri sendiri tanpa relasi silang di v1.0). |
| 13 | Alur Pemesanan Buku | **Pemesanan langsung via WhatsApp** (dengan template pesan dinamis judul & harga) serta **Tautan Marketplace Resmi** (Shopee & Tokopedia). Tanpa Cart atau Payment Gateway di v1.0. |

---

## Tahap 0 — Fondasi Proyek

**Tujuan:** repositori siap dikembangkan: tooling, dependency, struktur folder, tema, dan konfigurasi dasar.
**Referensi PRD:** §4, §10.1, §10.7, §10.11, §12, §19, §20, §21.

**Deliverables**
- [ ] Proyek Next.js 16.x (App Router, TS strict, Tailwind 4) via NPM.
- [ ] Dependency sesuai PRD §4.2 terpasang (termasuk Tiptap, DOMPurify, cmdk, next-themes); `package-lock.json` ter-commit.
- [ ] shadcn diinisialisasi (`components.json`), komponen dasar ditambahkan.
- [ ] Struktur folder PRD §4.5 dibuat lengkap (termasuk route group `(public)`, `(auth)`, `(admin)`, `api/`, dan `src/middleware.ts`).
- [ ] `src/configs/` untuk pembacaan & validasi env (zod); `env.example` terisi.
- [ ] Provider tema tunggal (`next-themes`), `next/font`, token warna semantik.
- [ ] Script NPM: `lint`, `typecheck`, `test`, `build`.
- [ ] `.gitignore` menutup `.env.local`; konfigurasi MCP/Context7 siap.

**Prompt**

```text
TUGAS: Tahap 0 — Fondasi Proyek. Baca PRD.md §4, §10, §12, §19, §20, §21.

1. Inisialisasi proyek Next.js 16.x (App Router, TypeScript strict, Tailwind CSS 4,
   ESLint, alias "@/*" -> src/*) memakai NPM. Pasang dependency PRD §4.2:
   @supabase/ssr, @supabase/supabase-js, @tanstack/react-query, @tanstack/react-table,
   zustand, react-hook-form, @hookform/resolvers, zod, recharts, sonner, lucide-react,
   cmdk, next-themes, @tailwindcss/typography, @tiptap/react, @tiptap/starter-kit,
   @tiptap/extension-link, @tiptap/extension-image, isomorphic-dompurify.
   Gunakan HANYA next-themes untuk tema. Tanpa library maplibre-gl di v1.0.
2. Jalankan init shadcn, lalu tambahkan komponen dasar: button, input, textarea,
   label, form, select, checkbox, switch, dialog, alert-dialog, sheet, sidebar,
   dropdown-menu, tabs, table, pagination, badge, card, skeleton, tooltip,
   separator, avatar, calendar, popover, sonner, breadcrumb, command.
3. Buat struktur folder persis seperti PRD §4.5 (src/actions, src/app/(admin),
   (auth), (public), _components, api, components/common, components/ui, configs,
   constants, hooks, lib/supabase, migrations, providers, stores, types,
   validations, middleware.ts) beserta file placeholder minimal agar route valid.
   Tambahkan folder docs/ dan note/.
4. src/configs/env.ts: baca & validasi env dengan zod. NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY (client-safe) dipisah dari SUPABASE_SERVICE_ROLE_KEY
   (server-only; gunakan penanda server-only agar tidak bisa di-import Client
   Component). Buat env.example berisi nama variabel + nilai contoh non-sensitif.
5. Setup tema: satu ThemeProvider di root layout, semantic token Tailwind/shadcn
   untuk light & dark, next/font (pilih font serif elegan untuk heading + sans
   untuk body yang cocok dengan citra penerbit), dan Toaster sonner.
6. Tambahkan script npm: lint, typecheck (tsc --noEmit), test (placeholder),
   build. Pastikan .gitignore menutup .env.local dan artefak build.
7. Konfigurasikan next.config.ts: allowlist ketat remotePatterns untuk gambar
   Supabase Storage saja (host dari env), tanpa pola wildcard luas.
8. Buat docs/README-dev.md: cara setup lokal, perintah NPM, struktur folder,
   dan aturan kontribusi singkat (ringkas dari PRD §21).

BATASAN: jangan implementasikan fitur bisnis apa pun di tahap ini.
DoD: npm run lint, typecheck, dan build lulus; halaman "/" menampilkan placeholder
dan toggle tema bekerja; tidak ada secret di repo.
```

**DoD tahap ini:** build hijau, struktur folder sesuai PRD, tema light/dark berjalan, tidak ada dependency di luar PRD kecuali yang dijelaskan.

---

## Tahap 1 — Database, RLS & Storage

**Tujuan:** skema database final, RLS ketat, bucket storage, dan seed deterministik.
**Referensi PRD:** §5, §6.2, §14, §15.4, §15.8, §16.1.

**Deliverables**
- [ ] Migrasi bernomor urut (`001_...` dst.) untuk: `profiles` (role `admin`/`super_admin`, `is_active`, `full_name`, `avatar_url`), `book_categories`, `blog_categories`, `books`, `book_images` (galeri), `book_related` (relasi manual), `posts`, `banners`, `site_pages` / `site_settings` (Hero, Tentang, Kontak, sosmed), `contact_inquiries` (status: `unread`, `replied`, `archived`).
- [ ] Trigger `updated_at`, trigger pembuatan `profiles` saat user dibuat di Auth.
- [ ] RLS aktif di semua tabel + policy eksplisit per operasi.
- [ ] Bucket Storage + policy (cover buku, galeri, thumbnail blog, avatar, aset halaman).
- [ ] Index berdasarkan pola query nyata (slug, kategori, harga, status publikasi, jadwal banner).
- [ ] Seed data dummy deterministik (tanpa kredensial nyata); seed Super Admin awal lewat prosedur terdokumentasi.

**Prompt**

```text
TUGAS: Tahap 1 — Database, RLS & Storage. Baca PRD.md §5, §6.2, §14, §15.4, §15.8.

Buat migration SQL di src/migrations dengan penomoran 001_, 002_, ... (satu tujuan
per file, nama deskriptif). JANGAN edit migration lama setelah dipakai bersama.

Skema (snake_case, PK uuid, FK, NOT NULL/UNIQUE/CHECK sedapat mungkin,
created_at & updated_at timestamptz):
- profiles: id (= auth.users.id), full_name, avatar_url, role enum
  ('admin','super_admin'), is_active boolean default true.
- book_categories: name, slug unique, description, seo_title, seo_description.
- blog_categories: name, slug unique, description, seo_title, seo_description.
- books: title, slug unique, description (HTML Tiptap), cover_url,
  category_id FK (ke book_categories), author, editor, publisher, publish_year,
  isbn, page_count, price_regular numeric CHECK >= 0, price_promo numeric NULL CHECK
  (price_promo IS NULL OR price_promo < price_regular), is_featured,
  is_published, shopee_url, tokopedia_url, whatsapp_number,
  whatsapp_message_template, seo_title, seo_description.
- book_images (galeri, urutan), book_related (pasangan manual book_id/related_id,
  tidak boleh menunjuk diri sendiri).
- posts: title, slug unique, excerpt, content (HTML Tiptap), cover_url,
  author_name (teks nama penulis), author_id (FK ke profiles, opsional),
  category_id (FK ke blog_categories), status ('draft','published'),
  published_at, seo_title, seo_description, tags text[].
- banners: message, link_url (internal path ke buku/artikel atau URL), starts_at,
  ends_at, is_active. CHECK starts_at < ends_at.
- site_content: key unik (hero, about, contact, social) + payload jsonb
  terstruktur (divalidasi zod di aplikasi).
- contact_inquiries: name, email, phone, subject, message, status enum
  ('unread', 'replied', 'archived') default 'unread', created_at.
Tambahkan juga fungsi SQL/RPC untuk pencarian global Command Dialog Ctrl+K
(judul buku, penulis, artikel blog) memakai full-text search atau pg_trgm.

Keamanan:
- ENABLE ROW LEVEL SECURITY di SEMUA tabel schema public.
- Policy anon: SELECT hanya konten terpublikasi (books.is_published, posts.status
  = 'published', banner aktif dalam jadwal, site_content, book_categories, blog_categories);
  contact_inquiries hanya INSERT (tanpa SELECT).
- Policy authenticated: berdasarkan fungsi helper SECURITY DEFINER
  is_active_admin() dan is_super_admin() (cek profiles.role & is_active);
  admin: CRUD konten & baca/update contact_inquiries; hanya super_admin: kelola profiles orang lain & pengaturan.
- User tidak boleh mengubah role/is_active miliknya sendiri.
- Index pada kolom yang dipakai policy dan filter (slug, category_id, is_published,
  published_at, starts_at/ends_at, price_regular).
- Storage: bucket publik untuk gambar katalog/blog (read publik, write hanya
  admin aktif) dan bucket avatar; policy path berbasis auth.uid() untuk avatar.
  Batasi ukuran & tipe file di policy/aplikasi.

Seed: src/migrations/seed (atau supabase/seed.sql) berisi kategori buku & blog,
~12 buku, ~6 artikel, 1 banner, konten halaman default (nomor WA 0813-8060-4256,
email frasaklausamedia@gmail.com). Tanpa password/secret nyata. Dokumentasikan di docs/
cara membuat Super Admin pertama.

Setelah selesai: buat docs/db-schema.md (ERD teks + penjelasan policy) dan
generate tipe TypeScript database ke src/types.

DoD: semua tabel RLS-on; uji policy dengan role anon & authenticated (bukan hanya
SQL editor admin) dan lampirkan hasil/skrip uji; migration dapat dijalankan
berurutan dari nol tanpa error.
```

**DoD tahap ini:** skema dapat di-bootstrap dari nol, semua tabel ber-RLS, policy teruji dengan role `anon` dan `authenticated`.

---

## Tahap 2 — Auth, Authorization & Keamanan Inti

**Tujuan:** login admin yang aman, proteksi server-side bertingkat, dan lapisan keamanan dasar.
**Referensi PRD:** §6.1, §9.3, §13, §14.1, §15.2–15.6, §15.9–15.12, §16.5.

**Deliverables**
- [ ] Helper Supabase browser/server/middleware di `src/lib/supabase`; client service-role terpisah dan server-only.
- [ ] `src/middleware.ts`: refresh session + gate `/admin` & `/login` berbasis session & role.
- [ ] Halaman login (`(auth)`), server action login/logout, open-redirect aman.
- [ ] Helper authorization reusable (`requireUser`, `requireAdmin`, `requireSuperAdmin`) yang cek data terbaru di DB (termasuk `is_active`).
- [ ] Rate limit untuk login & endpoint publik mutatif.
- [ ] Security headers (CSP, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors; HSTS hanya production).
- [ ] Pola response error/aksi yang konsisten & aman.

**Prompt**

```text
TUGAS: Tahap 2 — Auth, Authorization & Keamanan Inti.
Baca PRD.md §6.1, §9.3, §13, §14.1, §15.2–15.6, §15.9–15.12, §16.5.
Gunakan API Next.js 16 (middleware.ts, cookies(), Server Actions).

1. src/lib/supabase: createBrowserClient (hanya anon key), createServerClient
   (cookies, @supabase/ssr), helper untuk middleware, dan admin client (service role)
   yang diberi penanda server-only dan nama file yang tidak mudah ter-import
   Client Component.
2. src/middleware.ts: refresh session Supabase; redirect user belum login dari /admin ke
   /login; redirect user sudah login dari /login ke dashboard. Ini hanya lapisan
   pertama — jangan dijadikan satu-satunya kontrol akses.
3. src/lib (mis. lib/auth): requireUser(), requireAdmin(), requireSuperAdmin()
   yang membaca profil terbaru dari DB (role + is_active) di server; admin nonaktif
   ditolak. Kembalikan hanya field yang dibutuhkan UI.
4. (auth)/login: form shadcn + react-hook-form + zod. Server Action signIn:
   validasi server, pesan error generik (tanpa user enumeration), rate limit
   per IP+email, dan parameter redirect hanya boleh path internal (allowlist).
   Action signOut di src/actions. Tidak ada registrasi publik.
5. Rate limiting: implementasi modul terpisah dan dapat diganti
   (src/lib/rate-limit). Jelaskan pilihan storage (mis. tabel Supabase atau
   layanan eksternal) dan batasannya di lingkungan serverless Vercel.
6. next.config.ts / proxy: security headers PRD §15.9 — CSP yang disesuaikan untuk
   Supabase, gambar, font; hindari unsafe-eval di production; frame-ancestors;
   X-Content-Type-Options: nosniff; Referrer-Policy; Permissions-Policy;
   HSTS hanya production. Jangan salin buta; dokumentasikan tiap direktif.
7. Buat util respons aksi { ok, data | error } dan peta error HTTP (401/403/404/
   409/429/5xx) yang tidak membocorkan stack/SQL.
8. Tulis unit test untuk helper authorization & validator redirect.

DoD: user anonim tidak dapat memanggil action admin (uji langsung, bukan lewat UI);
admin nonaktif ditolak; tidak ada service role key di bundle client (cek hasil
build); header keamanan terverifikasi di respons.
```

**DoD tahap ini:** login/logout aman, `/admin` terlindungi berlapis (proxy + cek per-operasi), tidak ada kebocoran secret.

---

## Tahap 3 — Shell Admin (Sidebar, Navbar, Dashboard, Profil)

**Tujuan:** kerangka dashboard yang persisten, responsif, dan memenuhi revisi sidebar.
**Referensi PRD:** §3 (US-11, 12, 19), §6.2.A, §9.2, §10.3, §10.8, §11, §16.6 + **Revisi**.

**Deliverables**
- [ ] `(admin)/layout.tsx` sebagai **persistent layout** (Sidebar + Navbar tidak re-render/loading/flicker saat pindah halaman atau saat halaman di-refresh).
- [ ] Sidebar collapse/expand **tersimpan di cookies browser** (`sidebar_state`); default terbuka; tidak kembali collapse saat refresh.
- [ ] SSR Cookie Hydration: status sidebar dibaca di server via `cookies()` sehingga saat page di-refresh, sidebar **tidak ikut me-refresh**, tidak berkedip, dan tidak ada layout shift.
- [ ] Sidebar **responsif**: di layar mobile (< breakpoint desktop) menjadi drawer (Sheet) yang **slide-out dari sisi kiri** via tombol hamburger navbar.
- [ ] Menu sidebar mengikuti role (item Super Admin hanya tampil untuk `super_admin`, namun tetap dijaga di server).
- [ ] Dashboard: metrik (total buku, kategori, artikel, banner aktif) + chart sederhana dengan empty state.
- [ ] Halaman Profil (ubah nama, avatar, password).
- [ ] Loading skeleton yang **presisi** menyesuaikan komponen asli.

**Prompt**

```text
TUGAS: Tahap 3 — Shell Admin. Baca PRD.md §6.2.A, §9.2, §10.3, §10.8, §11, §16.6
dan bagian "Revisi" di akhir PRD.

1. (admin)/layout.tsx: Server Component yang memanggil requireAdmin(), lalu
   merender Sidebar + Navbar sebagai PERSISTENT layout (bukan di page) sehingga
   tidak re-render/loading/flicker saat navigasi antar halaman admin maupun saat
   halaman di-refresh. Gunakan next/link untuk seluruh navigasi internal.
2. Sidebar (gunakan komponen shadcn Sidebar):
   - Status collapsed/expanded disimpan di COOKIES browser (bukan localStorage).
     Cookie ditulis saat toggle (nama cookie: sidebar_state, path=/, max-age ±1 tahun,
     SameSite=Lax; hanya berisi preferensi UI, bukan data sensitif). Layout server
     membaca cookie lewat cookies() dan meneruskannya sebagai defaultOpen pada
     SidebarProvider sehingga SSR langsung merender state benar — saat halaman
     di-refresh sidebar TIDAK kembali collapse ke default dan tidak berkedip.
     Default saat cookie belum ada: terbuka (expanded).
   - Sidebar tidak boleh ikut "refresh/loading/flicker" ketika halaman berpindah atau
     di-refresh (karena berada di persistent layout dan di-hydrate dari cookies);
     hanya area konten yang menampilkan skeleton.
   - RESPONSIF: di breakpoint mobile (< desktop breakpoint), sidebar bertransformasi
     menjadi drawer (Sheet) yang slide-out dari sisi kiri, dibuka lewat tombol hamburger
     di navbar, tertutup otomatis setelah navigasi/klik overlay/swipe, dapat
     dioperasikan via keyboard, dan focus-trap benar.
   - Menu: Dashboard, Buku, Kategori Buku, Blog, Kategori Blog, Banner Promo, Konten Halaman, Inbox Pesan, Profil;
     khusus super_admin: Manajemen Akun, Pengaturan Sistem. Item khusus super_admin disembunyikan untuk admin, TETAPI
     halaman/actionnya tetap wajib requireSuperAdmin() di server.
3. Navbar admin: tombol hamburger sidebar, breadcrumb, toggle tema, menu user (profil, logout).
4. Dashboard (page.tsx, SSR): ambil metrik langsung di server lewat data-access
   layer (count query efisien, tanpa select('*')). Tampilkan 4 kartu metrik + chart
   recharts (mis. buku per kategori) dengan label, tooltip, legend, empty state;
   lazy-load chart. Jangan hanya mengandalkan warna untuk membedakan data.
5. loading.tsx untuk setiap segmen utama: skeleton harus MEMILIKI dimensi,
   proporsi, dan posisi yang persis sama dengan komponen asli agar tanpa layout
   shift (buat skeleton berdampingan dengan komponen aslinya).
6. Halaman Profil: ubah nama, ubah password (verifikasi server, aturan password
   kuat), upload avatar (validasi tipe/ukuran, nama object UUID, hapus file di
   storage jika simpan URL ke DB gagal sesuai PRD §14.5).
7. Responsif mobile-first; uji light/dark; semua kontrol dapat dipakai keyboard,
   icon-only button punya nama aksesibel.

DoD: refresh halaman di mode collapsed tetap collapsed (verifikasi cookie); saat page di-refresh
sidebar tidak ikut me-refresh atau berkedip; di lebar mobile sidebar berupa drawer yang slide out
dari sisi kiri; berpindah halaman tidak memuat ulang sidebar/navbar; skeleton tidak menyebabkan
layout shift; admin biasa tidak bisa membuka halaman Super Admin via URL langsung.
```

**DoD tahap ini:** seluruh poin Revisi sidebar terpenuhi, shell admin stabil dan responsif.

---

## Tahap 4 — CMS Kategori

**Tujuan:** pola CRUD pertama yang menjadi **template** bagi modul admin berikutnya.
**Referensi PRD:** §3 (US-14), §6.2.D, §10.4, §10.8, §13, §15.4.

**Deliverables**
- [ ] Tabel kategori (TanStack Table, server-side pagination/sort/search, state di URL).
- [ ] Form tambah/edit (dialog atau halaman), slug otomatis (dapat diedit, unik), SEO meta.
- [ ] Hapus dengan konfirmasi; cegah/atur perilaku saat kategori masih dipakai buku.
- [ ] Zod schema bersama, server actions dengan authz & revalidasi tepat sasaran.

**Prompt**

```text
TUGAS: Tahap 4 — CMS Kategori. Baca PRD.md §6.2.D, §10.4, §10.8, §13, §15.4.
Modul ini adalah TEMPLATE untuk modul CRUD admin lain: rapikan strukturnya agar
dapat direplikasi (konsisten dengan PRD §12 "Konsistensi Pola Logic").

1. src/validations/category.ts (zod): name (batas panjang), slug (regex slug,
   unik), seo_title/seo_description (batas panjang). Dipakai client & server.
2. Data-access layer server (src/lib atau modul domain): list (pagination, sort
   allowlist, search), getById, create, update, delete — kolom eksplisit.
3. Server Actions (src/actions): create/update/delete dengan requireAdmin(),
   validasi server, penanganan konflik slug (409), pesan error aman, dan
   revalidasi hanya path/tag yang terdampak.
4. UI (shadcn + TanStack Table): kolom nama, slug, jumlah buku, tanggal;
   pencarian, sorting, pagination (default 10; opsi 25/50/100) dengan page,
   pageSize, q, sort tersinkron di URL dan divalidasi (allowlist). Skeleton
   presisi, empty state, error state dengan tombol retry.
5. Form react-hook-form + zodResolver: generate slug otomatis dari nama (bisa
   di-override), tombol submit disabled + loading saat proses, error per field,
   toast sonner hanya untuk feedback global.
6. Hapus: AlertDialog konfirmasi. Tentukan perilaku bila kategori masih dipakai
   buku (tolak dengan pesan jelas ATAU reassign) dan dokumentasikan.
7. Tabel responsif di mobile (horizontal scroll atau column visibility).
8. Tulis unit test (validator slug, util) dan integration test untuk action
   (anonim ditolak, role salah ditolak, slug duplikat -> 409).

DoD: CRUD berjalan end-to-end; manipulasi query URL tidak merusak halaman; test lulus;
dokumentasikan pola modul di docs/ untuk dipakai Tahap 5–7.
```

---

## Tahap 5 — CMS Buku

**Tujuan:** modul inti katalog: data buku lengkap, upload aman, dan konfigurasi checkout multi-kanal.
**Referensi PRD:** §3 (US-13, US-18), §6.2.E, §7, §14.5, §15.5, §15.8.

**Deliverables**
- [ ] Tabel buku (filter kategori, status, pencarian; server-side).
- [ ] Form buku: info pokok, spesifikasi, harga normal/promo, status unggulan/publikasi.
- [ ] Rich text editor untuk deskripsi + sanitasi HTML (allowlist).
- [ ] Upload cover & galeri ke Supabase Storage (validasi, nama UUID, rollback file bila DB gagal).
- [ ] Pemilihan buku terkait (manual; fallback otomatis berdasarkan kategori).
- [ ] Pengaturan link Shopee, Tokopedia, WhatsApp (normalisasi nomor + template pesan).

**Prompt**

```text
TUGAS: Tahap 5 — CMS Buku. Baca PRD.md §6.2.E, §7, §14.5, §15.5, §15.8, §10.4.
Ikuti pola modul dari Tahap 4.

1. Validasi zod (src/validations/book.ts): title, slug unik, kategori wajib,
   author, editor, publisher, tahun (rentang wajar), ISBN (validasi format
   ISBN-10/13 + checksum, boleh kosong), halaman (int > 0),
   price_regular >= 0, price_promo opsional dan HARUS < price_regular,
   shopee_url/tokopedia_url hanya https dan host sesuai domain marketplace
   (allowlist: shopee.co.id / tokopedia.com + subdomain/short-link resmi),
   whatsapp_number dinormalisasi ke format internasional (0813... -> 62813...),
   whatsapp template pesan dengan placeholder {judul} dan {harga}.
2. Rich text editor untuk deskripsi memakai Tiptap (heading, paragraf, list,
   blockquote, link). Ini dependency baru — jelaskan alasan & dampak bundle,
   lazy-load (dynamic import), jangan dimuat di halaman lain. Sanitasi HTML di
   SERVER sebelum disimpan DAN saat dirender, dengan allowlist tag/atribut;
   hindari dangerouslySetInnerHTML kecuali output sudah tersanitasi.
3. Upload cover/galeri: action server memvalidasi ukuran (batas jelas), ekstensi &
   MIME (cek juga magic bytes), nama object UUID, lalu upload ke bucket.
   Setelah berhasil, simpan URL ke DB. JIKA simpan ke DB GAGAL, hapus file dari
   Storage (PRD §14.5). Saat buku/gambar dihapus atau diganti, bersihkan file lama.
   Galeri: urutan dapat diatur, minimal alt text per gambar.
4. Buku terkait: UI pencarian + pilih manual (maks N); jika kosong, fallback otomatis
   (kategori sama, terbaru) pada query publik.
5. Tabel buku (TanStack Table): cover thumbnail (next/image), judul, kategori,
   harga, status; filter kategori/status/harga, search, sorting allowlist,
   pagination default 10 — semua sinkron URL & server-side.
6. Aksi cepat: toggle published/featured dengan optimistic update React Query
   yang aman, tetap diverifikasi server.
7. Server-side: jangan percaya harga/status dari client untuk hal turunan;
   kembalikan hanya field yang diperlukan UI. Revalidasi tag buku, kategori,
   beranda, sitemap.
8. Preview "tombol checkout" di form: tombol Shopee/Tokopedia otomatis disembunyikan (hidden) bila link kosong (agar admin paham perilaku tampilan di publik).
9. Test: validator (ISBN, harga promo, URL marketplace, normalisasi WA),
   sanitasi HTML (payload XSS ditolak/dibersihkan), authz action, rollback upload.

DoD: tambah/edit/hapus buku lengkap dengan cover & galeri; tidak ada file yatim di
Storage setelah skenario gagal; payload XSS pada deskripsi tidak tereksekusi;
form kompleks tetap responsif dan aksesibel.
```

---

## Tahap 6 — CMS Blog

**Tujuan:** manajemen artikel literasi/berita/opini dengan editor, jadwal publikasi, dan SEO.
**Referensi PRD:** §3 (US-15), §6.2.F, §15.5, §16.2.

**Deliverables**
- [ ] Tabel artikel (status draft/published, filter kategori/tag, search).
- [ ] Form artikel: judul, slug, ringkasan, konten rich text, cover thumbnail, penulis, tanggal publikasi, kategori/tag, SEO meta.
- [ ] Gambar di dalam artikel (upload via editor ke Storage dengan validasi sama seperti Tahap 5).
- [ ] Perhitungan waktu baca (*read time*) di server.

**Prompt**

```text
TUGAS: Tahap 6 — CMS Blog. Baca PRD.md §6.2.F, §15.5, §16.2. Ikuti pola Tahap 4–5
dan gunakan ulang komponen editor + util sanitasi dari Tahap 5 (jangan duplikasi).

1. Validasi zod: title, slug unik, excerpt, content, kategori/tag (jumlah & panjang
   dibatasi), status ('draft'|'published'), published_at (valid; boleh dijadwalkan),
   seo_title/seo_description.
2. Editor: heading, paragraf, gambar, blockquote, link. Upload gambar inline lewat
   action server dengan validasi & aturan rollback yang sama seperti Tahap 5.
   Link diverifikasi (hanya http/https/mailto); tambahkan rel="noopener noreferrer"
   untuk link eksternal. Konten disanitasi saat simpan dan saat render.
3. Hitung read time (mis. ±200 kata/menit) di server dan simpan/turunkan secara
   konsisten; tampilkan di publik.
4. Tabel artikel: kolom judul, penulis, kategori, status, tanggal; filter &
   pencarian server-side; pagination default 10; state di URL.
5. Artikel berstatus draft TIDAK boleh bisa dibaca anon (pastikan RLS + query
   data-access); pratinjau draft hanya untuk admin berautentikasi.
6. Revalidasi tepat sasaran (daftar blog, detail artikel, beranda, sitemap).
7. Test: validator, sanitasi, anon tidak bisa baca draft, authz action.

DoD: artikel dapat dibuat/diedit/dihapus/dipublikasikan/dijadwalkan; draft tidak
bocor ke publik; gambar inline tidak menyisakan file yatim saat gagal.
```

---

## Tahap 7 — Banner Promo & Page CMS

**Tujuan:** kontrol konten halaman publik dan promosi berjadwal tanpa menyentuh kode.
**Referensi PRD:** §3 (US-16, US-17), §6.2.B–C, §8.

**Deliverables**
- [ ] CRUD banner: teks, tautan (internal ke buku/artikel atau eksternal), mulai/selesai (tanggal & jam), toggle aktif.
- [ ] Logika "banner aktif" server-side berbasis waktu & zona waktu konsisten (simpan UTC, tampil WIB).
- [ ] Editor konten halaman: Hero (headline, sub-headline, CTA, gambar), Tentang Kami (sejarah, visi, misi), Kontak & media sosial.
- [ ] Data default memakai identitas resmi PRD §8.

**Prompt**

```text
TUGAS: Tahap 7 — Banner Promo & Page CMS. Baca PRD.md §6.2.B–C, §8, §15.4.

1. Banner: validasi zod — message (batas panjang, plain text), link_url (path
   internal "/buku/[slug]" atau "/blog/[slug]" dari allowlist pola, ATAU URL https
   eksternal), starts_at < ends_at (validasi semantik di client dan server),
   is_active. Picker tanggal+jam memakai shadcn (calendar/popover) + input jam.
   Simpan timestamptz (UTC); tampilkan dan input dalam WIB (Asia/Jakarta).
2. Util server getActiveBanner(): banner dengan is_active = true DAN now() di
   antara starts_at–ends_at (jika ada beberapa, tentukan aturan prioritas dan
   dokumentasikan). Pastikan logika waktu dievaluasi di server/DB, bukan di client.
   Strategi cache: revalidate singkat/by-tag agar banner terjadwal tayang dan
   berhenti tanpa intervensi manual; jelaskan trade-off-nya.
3. Page CMS: simpan di tabel site_content (key: hero, about, contact, social)
   dengan skema zod per key. Form terpisah per bagian: Hero (headline,
   sub-headline, label+tujuan CTA, upload gambar), Tentang (sejarah, visi, misi),
   Kontak (telepon/WA default 0813-8060-4256, email frasaklausamedia@gmail.com,
   alamat bila ada) dan media sosial. Upload gambar mengikuti aturan Tahap 5.
4. Semua teks ditampilkan sebagai teks/rich text tersanitasi; tidak ada HTML mentah.
5. Sediakan fallback konten default bila record kosong agar halaman publik tidak
   pernah kosong/rusak.
6. Revalidasi tag yang tepat setelah simpan.
7. Test: validasi jadwal (start<=end), logika banner aktif pada batas waktu,
   authz action.

DoD: banner tayang/berhenti sesuai jadwal tanpa aksi manual; perubahan Hero/Tentang/
Kontak muncul di publik setelah revalidasi; input jadwal tidak valid ditolak
server.
```

---

## Tahap 8 — Manajemen Akun & Pengaturan (Super Admin)

**Tujuan:** kontrol akses tim dan konfigurasi sistem khusus Super Admin.
**Referensi PRD:** §3 (US-20–23), §5, §6.1, §15.2–15.3.

**Deliverables**
- [ ] Daftar akun admin; undang/buat admin baru (hanya Super Admin).
- [ ] Aktif/nonaktifkan akun, reset kredensial.
- [ ] Halaman Pengaturan Sistem (konfigurasi global & integrasi pihak ketiga).
- [ ] Audit log aksi sensitif (actor, aksi, target, waktu, hasil).

**Prompt**

```text
TUGAS: Tahap 8 — Manajemen Akun & Pengaturan. Baca PRD.md §5, §6.1, §15.2–15.3, §16.7.

1. Semua halaman & action di sini WAJIB requireSuperAdmin() di server (jangan hanya
   menyembunyikan menu). Admin biasa harus mendapat 403.
2. Daftar akun (TanStack Table server-side, pagination default 10): nama, email,
   role, status, dibuat pada. Pencarian & filter status.
3. Buat akun admin baru: input email + nama + password sementara; gunakan Supabase Auth Admin API
   (service role, hanya di server via supabase.auth.admin.createUser) untuk membuat akun dan mengisi
   profiles dengan role 'admin'. Akun langsung berstatus aktif tanpa dependensi server email SMTP di awal.
   Hanya Super Admin yang bisa membuat akun; role 'super_admin' tidak dapat diberikan lewat UI ini.
   Cegah user enumeration dan duplikasi email dengan respons yang aman.
4. Aktif/nonaktif akun: set profiles.is_active; pastikan akun nonaktif langsung
   ditolak oleh requireAdmin() dan RLS. Super Admin tidak boleh menonaktifkan
   dirinya sendiri atau Super Admin terakhir.
5. Reset kredensial: kirim email reset via Supabase; jangan pernah menampilkan
   password/token di UI atau log.
6. Halaman Pengaturan: konfigurasi global (mis. nama situs, kontak default,
   toggle fitur) disimpan di tabel pengaturan dengan validasi zod. Dokumentasikan
   setiap setting; jangan simpan secret di tabel ini.
7. Audit log append-only (tabel audit_logs): catat actor id, action, target,
   timestamp, hasil, metadata aman — tanpa PII/secret. Tulis log pada aksi
   buat/nonaktifkan/reset akun & ubah pengaturan.
8. Rate limit pada action undang & reset.
9. Test: admin biasa -> 403 pada semua action; Super Admin tidak bisa
   menonaktifkan diri sendiri; akun nonaktif tidak bisa login/akses.

DoD: alur undang -> login admin baru -> nonaktifkan -> akses ditolak berjalan;
service role key tidak muncul di bundle client; audit log tercatat.
```

---

## Tahap 9 — Layout Publik (Banner, Navbar, Footer, Search)

**Tujuan:** kerangka halaman publik yang persisten dengan sticky banner, navbar, footer dinamis, dan pencarian global.
**Referensi PRD:** §3 (US-07, US-10), §6.3.1, §6.3.8, §9.2, §10.2, §10.6, **Revisi footer**.

**Deliverables**
- [ ] `(public)/layout.tsx` persisten: sticky banner → navbar → konten → footer.
- [ ] Footer publik: copyright dengan format `[Company Name] © [tahun]` (berubah otomatis sesuai tahun current / tahun berjalan).
- [ ] Navbar responsif (menu mobile via Sheet), toggle tema, link cepat.
- [ ] Global search dengan debounce, pembatalan request lama, hasil buku + artikel.
- [ ] Skeleton presisi untuk navbar/banner/hasil pencarian.

**Prompt**

```text
TUGAS: Tahap 9 — Layout Publik. Baca PRD.md §6.3.1, §6.3.8, §6.3.9, §9.2, §10.2, §10.6
dan revisi footer di PRD.

1. (public)/layout.tsx: Server Component PERSISTEN berisi: StickyBanner (data dari
   getActiveBanner() Tahap 7; render null bila tidak aktif, dengan tombol tutup
   yang tidak merusak layout), Navbar, {children}, Footer. Banner & navbar tidak
   re-render saat berpindah halaman.
2. Footer: tampilkan teks copyright dengan format baku "[Company Name] © {tahun}"
   (contoh default: "Frasa Klausa Media © {tahun}") dengan nilai tahun BERJALAN otomatis
   (current year, bukan hardcode). Pastikan tahun tidak "membeku" pada hasil static build:
   gunakan komponen kecil yang dihitung saat render (runtime/SSR) dengan strategi cache
   yang tepat (mis. revalidate periodik) atau Client Component minimal untuk tahun;
   jelaskan pilihan dan trade-off-nya. Tambahkan juga kontak (email, WA) & sosmed dari
   Page CMS, serta tautan navigasi dengan teks deskriptif.
3. Navbar: logo, menu (Beranda, Katalog, Blog, Tentang Kami, Kontak), search bar
   global, link cepat. Mobile-first; menu mobile memakai Sheet shadcn yang aksesibel.
   Semua navigasi internal memakai next/link.
4. Global search (PRD §6.3.8): Command Dialog modal (shadcn Command / cmdk) yang
   dapat dibuka via shortcut keyboard Ctrl + K atau klik ikon pencarian di navbar.
   Dilengkapi DEBOUNCE (±300ms), min karakter, membatalkan request lama, hasil
   dikelompokkan Buku (cover, judul, penulis, harga) dan Artikel Blog, state loading/empty/error.
   Gunakan RPC full-text dari Tahap 1 lewat Server Action/Route Handler publik yang
   divalidasi dan di-rate-limit. Navigasi keyboard penuh (panah/enter/escape) dan aksesibel.
5. Skeleton presisi untuk bagian-bagian di atas; tanpa layout shift.
6. Light/dark mode, kontras WCAG AA, focus state jelas.

DoD: banner/navbar/footer tidak muncul ulang saat navigasi; format copyright footer
"[Company Name] © [tahun]" sesuai tahun berjalan (current year); pencarian cepat
berganti query tanpa race condition; endpoint search tahan input berlebihan dan rate limit.
```

---

## Tahap 10 — Halaman Publik: Beranda, Katalog, Detail Buku

**Tujuan:** pengalaman jelajah & konversi: beranda, katalog dengan filter, dan detail buku dengan checkout multi-kanal.
**Referensi PRD:** §3 (US-01–05), §6.3.2–4, §7, §10.7, §10.2.

**Deliverables**
- [ ] Beranda: Hero dinamis, buku unggulan/rilis terbaru, kategori populer, artikel terbaru, sekilas Tentang.
- [ ] Katalog & halaman kategori: grid kartu buku, filter kategori + rentang harga (state di URL), pagination.
- [ ] Detail buku: galeri, badge promo, harga normal vs promo, "Tentang Buku", tabel spesifikasi, buku terkait.
- [ ] Tombol checkout WhatsApp/Shopee/Tokopedia; **disabled/disembunyikan** bila link kosong.
- [ ] `loading.tsx`, `not-found.tsx`, `error.tsx` per segmen.

**Prompt**

```text
TUGAS: Tahap 10 — Beranda, Katalog, Detail Buku. Baca PRD.md §6.3.2–4, §7, §10.2,
§10.7, §9.1.

Semua halaman: Server Component, data diambil langsung di server lewat data-access
layer (tanpa fetch HTTP ke API internal). Hanya komponen interaktif kecil yang
menjadi Client Component. Pakai next/image dengan dimensi/aspect-ratio tetap, alt
deskriptif.

1. Beranda "/": Hero dari Page CMS (CTA dinamis), carousel/grid Buku Unggulan &
   Rilis Terbaru, Kategori Populer, Artikel Blog Terbaru, Sekilas Tentang. Strategi
   cache: static + revalidate by tag; dokumentasikan.
2. Katalog "/buku" & kategori "/kategori/[slug]": grid kartu (cover, judul,
   penulis, harga; tampilkan harga coret bila promo). Filter kategori + rentang
   harga (min/max) + sorting; semua di URL searchParams dan DIVALIDASI (allowlist
   sort, angka dibatasi). Pagination server-side. Hindari duplicate content/
   index berlebihan untuk kombinasi filter (canonical/noindex yang sesuai —
   selaras Tahap 12). Empty state yang ramah.
3. Detail "/buku/[slug]": galeri (dukungan keyboard, alt), judul, badge promo,
   perbandingan harga normal vs promo, "Tentang Buku" (HTML tersanitasi dengan
   tipografi nyaman), tabel spesifikasi (Penulis, Editor, Penerbit, Tahun, ISBN,
   Halaman), Buku Terkait (manual -> fallback otomatis). Slug tidak ditemukan ->
   not-found.tsx; buku tidak terpublikasi tidak boleh bisa diakses anon.
4. Checkout multi-kanal (PRD §7):
   - WhatsApp: tautan https://wa.me/<nomor internasional>?text=<encodeURIComponent>
     dengan format pesan baku: "Halo Frasa Klausa Media, saya ingin memesan buku \"[Judul Buku]\" seharga [Harga]. Apakah stok masih tersedia?"
     yang DIBENTUK DI SERVER dari data DB (bukan dari client). Fallback nomor default: 0813-8060-4256.
   - Shopee/Tokopedia: tautan langsung ke toko resmi, target _blank dengan rel="noopener noreferrer".
   - Fallback: bila URL Shopee atau Tokopedia kosong, tombol otomatis DISEMBUNYIKAN (hidden)
     agar menjaga tampilan detail buku tetap bersih dan menghindari dead click.
   - Format harga IDR konsisten (Intl.NumberFormat id-ID).
5. loading.tsx (skeleton presisi), error.tsx (dengan retry), not-found.tsx.
6. Responsif mobile-first, light/dark, aksesibel (heading hierarchy satu h1,
   tombol punya label, fokus terlihat).
7. Test e2e awal: filter harga/kategori via URL, tombol marketplace tersembunyi saat link kosong,
   URL WhatsApp berisi pesan baku dan harga yang benar.

DoD: seluruh user story US-01–US-05 dapat didemokan; buku draft/tidak terpublikasi
tidak bisa diakses; CLS minimal (cover memakai aspect ratio tetap).
```

---

## Tahap 11 — Halaman Publik: Blog, Tentang Kami, Kontak

**Tujuan:** melengkapi seluruh halaman publik v1.0.
**Referensi PRD:** §3 (US-06, US-08, US-09, US-20), §6.3.5–7, §13, §15.11.

**Deliverables**
- [ ] Daftar blog (paginasi atau infinite scroll), filter kategori blog, pencarian artikel.
- [ ] Halaman baca artikel: tipografi (`prose`), waktu baca, artikel terkait.
- [ ] Halaman Tentang Kami dari Page CMS.
- [ ] Halaman Kontak: detail resmi + Google Maps Embed responsif + form inquiry (validasi, rate limit, anti-spam).
- [ ] Inbox pesan kontak di CMS Admin (tabel `contact_inquiries`, filter status: `unread`, `replied`, `archived`).

**Prompt**

```text
TUGAS: Tahap 11 — Blog, Tentang Kami, Kontak. Baca PRD.md §6.3.5–7, §13, §15.11.

1. Blog "/blog": daftar artikel terpublikasi (published_at <= now), filter
   kategori blog & pencarian artikel via URL searchParams (divalidasi), paginasi
   server-side. Gunakan pagination (lebih ramah SEO) — jika memakai infinite
   scroll, sediakan fallback link halaman berikutnya. Kartu: thumbnail, judul,
   ringkasan, tanggal, waktu baca.
2. "/blog/[slug]": konten tersanitasi dengan tipografi teroptimasi (Tailwind
   typography/prose), read time, penulis (author_name), tanggal, artikel terkait
   (kategori sama), tombol bagikan sederhana. Satu h1. Draft/tidak
   terpublikasi -> not-found untuk anon.
3. "/tentang-kami": render sejarah, visi, misi, identitas dari Page CMS dengan
   fallback default.
4. "/kontak": tampilkan telepon/WA 0813-8060-4256 dan email
   frasaklausamedia@gmail.com (dari Page CMS) + sosmed. Peta lokasi kantor
   memakai Google Maps Embed responsif / link resmi tanpa dependensi maplibre-gl.
   Form inquiry (react-hook-form + zod): nama, email, telepon, subjek, pesan dengan batas panjang.
   Server Action publik: validasi server, honeypot field tersembunyi, rate limit
   (IP + email), simpan ke contact_inquiries (status default 'unread', anon hanya INSERT),
   respons generik dan aman, tombol submit disabled saat loading (cegah submit ganda),
   error per field + toast sukses.
5. Admin: halaman "Inbox Pesan" (tabel server-side dari contact_inquiries, filter status
   unread/replied/archived, tandai status penanganan) — hanya admin aktif.
6. Semua halaman: loading/empty/error state, responsif, light/dark, aksesibel
   (label terhubung ke input, error terbaca screen reader).
7. Test e2e: kirim form valid, validasi gagal, rate limit memicu 429, honeypot.

DoD: US-06, US-08, US-09 dapat didemokan; form kontak tahan spam dasar; pesan
tersimpan dan terlihat di admin.
```

---

## Tahap 12 — SEO, Performa & Aksesibilitas

**Tujuan:** memenuhi target Core Web Vitals, SEO teknis, dan WCAG 2.2 AA.
**Referensi PRD:** §10.7, §11, §16.1–16.4.

**Deliverables**
- [ ] Metadata API dinamis, OpenGraph/Twitter card, OG image, canonical, title/description unik.
- [ ] JSON-LD Book schema (detail buku) & data terstruktur lain yang sesuai.
- [ ] `sitemap.ts` (hanya URL canonical & terindeks) dan `robots.ts`; admin/auth/preview `noindex`.
- [ ] Audit Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP baik) & perbaikan.
- [ ] Audit aksesibilitas (keyboard, kontras, heading, reduced motion).
- [ ] Strategi cache/revalidation terdokumentasi.

**Prompt**

```text
TUGAS: Tahap 12 — SEO, Performa & Aksesibilitas. Baca PRD.md §10.7, §11, §16.1–16.4.

SEO:
1. Metadata API Next.js (generateMetadata) untuk semua halaman publik: title &
   description unik, canonical, OpenGraph, Twitter card, OG image (statis atau
   dinamis). Halaman filter/pencarian kombinasi query: canonical ke halaman dasar
   atau noindex agar tidak ada duplicate content.
2. JSON-LD "Book" pada detail buku (name, author, isbn, publisher, datePublished,
   numberOfPages, image, offers dengan harga efektif & priceCurrency IDR).
   Hanya isi data yang benar; sanitasi/escape saat menyisipkan ke <script>.
   Pertimbangkan Article untuk blog dan Organization untuk beranda.
3. src/app/sitemap.ts dinamis (buku, kategori, artikel terpublikasi, halaman
   statis; hanya URL canonical) dan src/app/robots.ts. Pastikan /admin, /login,
   preview, dan halaman private noindex (metadata robots + robots.txt).
4. Pastikan satu h1 logis per halaman, internal link deskriptif (hindari "klik
   di sini"), status 404/redirect benar (tidak soft-404, tidak ada loop).
5. Siapkan panduan integrasi Google Search Console (docs/seo.md).

PERFORMA:
6. Ukur dulu (Lighthouse/PageSpeed/Web Vitals) sebelum optimasi kompleks;
   simpan baseline & hasil di docs/performance.md. Target: LCP < 2.5s, CLS < 0.1,
   INP baik.
7. Gambar: next/image dengan sizes, priority hanya untuk LCP image, lazy sisanya;
   next/font sudah dipakai. Lazy-load chart, editor, map (jika dipakai) via
   dynamic import. Hindari hydration/re-render berlebihan; memoization hanya bila
   terukur perlu.
8. Dokumentasikan strategi cache per halaman (static/ISR/dynamic/user-specific)
   dan pastikan tidak ada data private di cache shared.

AKSESIBILITAS:
9. Audit WCAG 2.2 AA: keyboard-only untuk semua alur utama, focus terlihat,
   label form, nama aksesibel icon-button, alt gambar (alt="" untuk dekoratif),
   kontras light & dark, hormati prefers-reduced-motion, heading hierarchy.
   Jalankan axe (otomatis) lalu cek manual dengan pembaca layar pada alur utama.

DoD: skor Lighthouse/CWV memenuhi target pada halaman utama (mobile); Rich Results
Test valid untuk Book; sitemap/robots benar; tidak ada pelanggaran axe kritis.
```

---

## Tahap 13 — Keep-Alive, Logging & Hardening

**Tujuan:** mencegah auto-pause Supabase, observability, dan pengerasan keamanan final.
**Referensi PRD:** §14.6, §15, §16.7, §18.

**Deliverables**
- [ ] Route `/api/keep-alive` (query baca ringan) + `vercel.json` cron tiap 5 hari.
- [ ] Structured logging dengan request/correlation id & redaksi PII/secret.
- [ ] Error tracking/monitoring (jika tersedia), pembedaan expected vs unexpected error.
- [ ] Review keamanan menyeluruh (CSP final, CORS, SSRF, upload, dependency audit).

**Prompt**

```text
TUGAS: Tahap 13 — Keep-Alive, Logging & Hardening. Baca PRD.md §14.6, §15, §16.7, §18.

1. Keep-alive: buat Route Handler GET /api/keep-alive yang menjalankan SATU query
   baca sangat ringan ke Supabase (mis. select 1 baris dari tabel kecil, kolom
   eksplisit). Lindungi dari penyalahgunaan: verifikasi header Authorization
   dengan CRON_SECRET (Vercel Cron mengirimnya) atau mekanisme setara; rate limit;
   respons minimal tanpa detail internal; JANGAN dapat di-cache. Tambahkan
   CRON_SECRET ke env.example.
2. vercel.json: konfigurasikan Vercel Cron memanggil /api/keep-alive setiap 5 hari
   (mis. ekspresi cron "0 3 */5 * *"). Catatan: "*/5" pada hari-dalam-bulan akan
   reset di awal bulan sehingga interval bisa < 5 hari di akhir/awal bulan —
   dokumentasikan bahwa ini dapat diterima untuk tujuan menjaga project tetap aktif.
   Pastikan interval jauh di bawah ambang auto-pause Supabase.
3. Logging terstruktur (modul src/lib/logger): JSON log dengan request id,
   route/action, status, durasi, actor id non-sensitif; redaksi otomatis untuk
   password, token, cookie, service role key, dan PII yang tidak perlu.
   Terapkan pada action/handler penting (login, mutasi admin, upload, search,
   kontak, keep-alive).
4. Monitoring: integrasikan error tracking yang tersedia; bedakan expected error
   (validasi/not found) dari unexpected agar alert tidak noisy; dokumentasikan
   metrik yang dipantau (error rate, latency, query lambat, auth failure, 429).
5. Hardening review (checklist PRD §15): CSP final diuji dengan semua resource
   nyata; CORS tidak wildcard untuk endpoint private; tidak ada fetch server-side
   ke URL arbitrer user (SSRF); validasi upload (ukuran/MIME/magic bytes);
   npm audit & review dependency; pastikan source map/log tidak membocorkan
   secret; periksa tidak ada 'NEXT_PUBLIC_' berisi secret.
6. Dokumentasikan hasil di docs/security-review.md beserta temuan & perbaikannya.

DoD: cron terdaftar & endpoint hanya merespons panggilan sah; log tidak berisi
secret/PII (uji dengan sampel); tidak ada temuan keamanan kritis tersisa.
```

---

## Tahap 14 — Testing

**Tujuan:** jaring pengaman otomatis untuk flow kritikal dan keamanan data.
**Referensi PRD:** §17, §25.

**Deliverables**
- [ ] Unit test (utility, validator, business rule).
- [ ] Integration test (data-access, action, auth, RLS dengan role `anon`/`authenticated`).
- [ ] E2E test (Playwright) flow kritikal publik & admin.
- [ ] Seed test deterministik tanpa kredensial nyata; coverage terukur.

**Prompt**

```text
TUGAS: Tahap 14 — Testing. Baca PRD.md §17 dan §25.

1. Unit (mis. Vitest): validator zod (buku, banner, kategori, kontak), util slug,
   normalisasi WA, format harga, logika banner aktif, sanitasi HTML, util
   redirect aman, helper authorization.
2. Integrasi: server actions & data-access dengan database test (Supabase lokal
   atau project test terpisah — JANGAN data production). Uji RLS dengan role anon
   dan authenticated yang menyerupai aplikasi nyata: anon tidak bisa SELECT draft/
   tabel admin, anon hanya INSERT contact_messages, admin biasa tidak bisa
   mengelola akun, admin nonaktif ditolak.
3. E2E (Playwright), minimal:
   - Admin: login/logout; akses tanpa login ditolak; admin biasa tidak bisa buka
     halaman Super Admin; CRUD kategori/buku/blog/banner; upload cover; sidebar
     collapse bertahan setelah refresh (tersimpan di cookies) dan tidak ikut me-refresh/berkedip;
     sidebar mobile berupa drawer yang slide out dari sisi kiri.
   - Super Admin: undang admin, nonaktifkan, admin tsb ditolak.
   - Publik: beranda, katalog + filter kategori/harga, detail buku, tombol
     checkout (aktif & disabled), URL WhatsApp, blog, search global, kontak
     (valid, invalid, rate limit), banner tayang sesuai jadwal, footer copyright
     berformat [Company Name] © [tahun] dengan tahun berjalan yang valid.
   - Negative/abuse: input manipulatif pada query param, akses resource lintas
     role, payload XSS pada konten.
4. Seed test deterministik (tanpa kredensial asli); tes saling terisolasi dan tidak
   bergantung pada detail implementasi komponen UI (gunakan role/label).
5. Tambah script: npm test, npm run test:e2e, coverage; target coverage minimal
   disepakati dan dilaporkan untuk logika kritis (authz, validasi, harga, banner).
6. Jalankan axe pada halaman utama di dalam e2e untuk regresi aksesibilitas.

DoD: seluruh test lulus lokal dan di CI; flow kritikal PRD §17 tercakup; tidak ada
test yang dimatikan hanya untuk meloloskan CI.
```

---

## Tahap 15 — CI/CD, Deploy & Serah Terima

**Tujuan:** pipeline otomatis, deployment produksi aman, dan UAT.
**Referensi PRD:** §22, §21, §25, §26.

**Deliverables**
- [ ] Pipeline CI: `npm ci` → lint → typecheck → test → build (+ e2e & audit bila memungkinkan).
- [ ] Environment dev/preview/production dengan env terpisah di Vercel.
- [ ] Prosedur migrasi produksi yang aman + rollback/recovery plan.
- [ ] Domain + HTTPS + HSTS (production saja), Search Console.
- [ ] UAT dengan tim internal, checklist PRD §25 & §26 terpenuhi, dokumentasi serah terima.

**Prompt**

```text
TUGAS: Tahap 15 — CI/CD, Deploy & Serah Terima. Baca PRD.md §22, §21, §25, §26.

1. CI (mis. GitHub Actions): pada PR dan push ke main jalankan npm ci
   (deterministic), lint, typecheck, unit/integration test, build production, dan
   npm audit (tingkat peringatan dikonfigurasi). E2E dijalankan terhadap preview
   atau service lokal. Dilarang menonaktifkan lint/typecheck/test demi CI hijau.
2. Vercel: pisahkan environment Development/Preview/Production. Secret (service role
   key, CRON_SECRET) hanya di environment platform, bukan di repo. Verifikasi
   variabel NEXT_PUBLIC_* tidak berisi secret. Pastikan vercel.json (cron) aktif
   di production.
3. Migrasi produksi: tulis docs/deploy.md berisi urutan aman — jalankan migration
   (additive lebih dulu) SEBELUM kode yang bergantung pada skema baru; untuk
   perubahan breaking gunakan tahap: tambah struktur baru -> backfill -> pindah
   baca/tulis -> hapus struktur lama (migration terpisah). Sertakan backup sebelum
   migrasi dan strategi rollback aplikasi (Vercel instant rollback) + recovery data.
4. Buat Super Admin produksi sesuai prosedur dokumentasi (tanpa password di repo),
   ganti seluruh kredensial contoh/seed, nonaktifkan seed dummy di production.
5. Domain & HTTPS; aktifkan HSTS hanya setelah domain/subdomain siap HTTPS;
   daftarkan sitemap ke Google Search Console; verifikasi robots & noindex admin.
6. UAT: susun skrip uji untuk tim internal (admin & super admin) mencakup semua
   user story US-01–US-23 dan checklist PRD §25; catat temuan & perbaikan.
7. Serah terima: docs/ berisi panduan admin (mengelola buku, blog, banner, konten
   halaman, akun), panduan developer, runbook insiden (rollback, rotasi key,
   cron/keep-alive gagal), dan daftar keputusan/asumsi dari ROADMAP ini yang
   sudah dikonfirmasi.

DoD: deploy production berhasil dari pipeline; UAT disetujui; checklist
akhir v1.0 di bawah terpenuhi seluruhnya.
```

---

## Checklist Akhir v1.0

Disarikan dari PRD §25 dan §26. Tandai setelah seluruh tahap selesai.

**Fitur**
- [ ] Halaman publik lengkap: Beranda, Katalog, Detail Buku, Blog, Tentang Kami, Kontak, dan Footer.
- [ ] Sticky banner promo berjadwal tayang & berhenti otomatis.
- [ ] Global search (debounce) untuk buku dan artikel.
- [ ] Checkout multi-kanal WhatsApp / Shopee / Tokopedia; tombol disabled bila link kosong.
- [ ] CMS Admin: Kategori, Buku, Blog, Banner, Konten Halaman, Profil.
- [ ] Super Admin: undang/nonaktifkan/reset akun, Pengaturan Sistem.
- [ ] Footer copyright format `[Company Name] © [tahun]` (berubah otomatis sesuai tahun current).
- [ ] Sidebar admin: collapse tersimpan di cookies browser, tidak ikut refresh/berkedip, slide-out dari sisi kiri di mobile.
- [ ] Keep-alive `/api/keep-alive` via Vercel Cron setiap 5 hari.

**Kualitas & Keamanan**
- [ ] TypeScript, lint, build tanpa error baru.
- [ ] RLS aktif di semua tabel dan teruji dengan role `anon` & `authenticated`.
- [ ] Authn/authz diperiksa di server pada setiap action/handler sensitif.
- [ ] Tidak ada secret bocor ke client/log/repository.
- [ ] Validasi client + server; XSS/CSRF/SSRF/upload dikaji.
- [ ] Loading, empty, error, success state tersedia; skeleton presisi.
- [ ] Mobile/tablet/desktop & light/dark teruji; aksesibilitas WCAG 2.2 AA dasar.
- [ ] SEO: metadata, JSON-LD Book, sitemap, robots, noindex untuk area private.
- [ ] Core Web Vitals memenuhi target (LCP < 2.5s, CLS < 0.1).
- [ ] Test unit/integrasi/e2e relevan lulus; migration baru aman & berurutan.
- [ ] Dokumentasi & `env.example` mutakhir.

**Di luar scope v1.0 (jangan dikerjakan):** payment gateway, checkout langsung di platform, pengecekan transaksi real-time (SSE), login/registrasi pengunjung publik.