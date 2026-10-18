# PRD Final — Website & CMS Frasa Klausa Media

**Proyek:** Website & CMS Frasa Klausa Media
**Deskripsi:** Mewujudkan Naskah Menjadi Buku
**Versi:** 1.0
**Status:** Approved / Ready for Implementation
**Terakhir Diperbarui:** 2026-10-18

---

## Daftar Isi

- [1. Latar Belakang & Tujuan](#1-latar-belakang--tujuan)
- [2. Target Pengguna](#2-target-pengguna)
- [3. User Story](#3-user-story)
- [4. Tech Stack & Ekosistem](#4-tech-stack--ekosistem)
- [5. Hak Akses & Peran Pengguna](#5-hak-akses--peran-pengguna)
- [6. Kebutuhan Fungsional](#6-kebutuhan-fungsional)
- [7. Integrasi Checkout & Pemesanan](#7-integrasi-checkout--pemesanan)
- [8. Identitas Resmi & Kontak](#8-identitas-resmi--kontak)
- [9. Arsitektur & Rendering](#9-arsitektur--rendering)
- [10. Pedoman Frontend](#10-pedoman-frontend)
- [11. Aksesibilitas](#11-aksesibilitas)
- [12. TypeScript & Kualitas Kode](#12-typescript--kualitas-kode)
- [13. Server Actions & Route Handlers](#13-server-actions--route-handlers)
- [14. Supabase](#14-supabase)
- [15. Keamanan Web](#15-keamanan-web)
- [16. Kebutuhan Non-Fungsional](#16-kebutuhan-non-fungsional)
- [17. Testing](#17-testing)
- [18. API & Integrasi Pihak Ketiga](#18-api--integrasi-pihak-ketiga)
- [19. Struktur Folder & Modularitas](#19-struktur-folder--modularitas)
- [20. Konvensi Penamaan](#20-konvensi-penamaan)
- [21. Git & Code Review](#21-git--code-review)
- [22. CI/CD & Deployment](#22-cicd--deployment)
- [23. Aturan Penggunaan AI/Coding Agent](#23-aturan-penggunaan-aicoding-agent)
- [24. Prioritas Pengambilan Keputusan](#24-prioritas-pengambilan-keputusan)
- [25. Checklist Sebelum Selesai](#25-checklist-sebelum-selesai)
- [26. Scope & Batasan Versi 1.0](#26-scope--batasan-versi-10)

---

## 1. Latar Belakang & Tujuan

### 1.1 Latar Belakang

Frasa Klausa Media memerlukan platform web modern yang berfungsi ganda:

1. **Halaman Publik:** Etalase digital profesional untuk memamerkan katalog buku, karya penulis, artikel literasi (blog), serta menyediakan akses pembelian yang fleksibel bagi pembaca.
2. **Dashboard CMS (Admin):** Sistem manajemen konten terpusat yang memudahkan tim internal mengelola seluruh aset digital secara mandiri, aman, dan efisien.

### 1.2 Tujuan Proyek

- Menghadirkan identitas digital Frasa Klausa Media yang kredibel, elegan, dan berkinerja tinggi.
- Memfasilitasi konversi penjualan buku melalui integrasi multi-kanal checkout (WhatsApp, Shopee, Tokopedia).
- Memberikan kontrol penuh atas konten halaman publik, promosi berjadwal (sticky banner), katalog buku, dan artikel blog melalui admin panel.

---

## 2. Target Pengguna

| Segmen | Usia | Deskripsi |
| :----- | :--- | :-------- |
| **Admin / Super Admin** | ~30-an | Tim internal Frasa Klausa Media yang mengelola konten, katalog buku, artikel blog, dan konfigurasi website melalui dashboard CMS. |
| **Pengunjung / Client** | 20 – 40-an | Pembaca, penulis, dan calon pembeli buku yang mengakses halaman publik untuk menjelajahi katalog, membaca artikel literasi, dan melakukan pemesanan buku. |

---

## 3. User Story

### Pengunjung (Publik)

| ID | Sebagai... | Saya ingin... | Agar... |
| :- | :--------- | :------------ | :------ |
| US-01 | Pengunjung | melihat halaman beranda yang menarik dengan sorotan buku unggulan dan rilis terbaru | saya tertarik menjelajahi katalog lebih lanjut. |
| US-02 | Pengunjung | menjelajahi katalog buku dengan filter kategori dan rentang harga | saya dapat menemukan buku yang sesuai minat saya dengan cepat. |
| US-03 | Pengunjung | melihat halaman detail buku lengkap (cover, deskripsi, spesifikasi, harga) | saya dapat memutuskan apakah ingin membeli buku tersebut. |
| US-04 | Pengunjung | memesan buku melalui WhatsApp dengan pesan otomatis berisi judul dan harga | saya dapat langsung berkomunikasi dengan penjual tanpa repot mengetik ulang. |
| US-05 | Pengunjung | diarahkan ke toko Shopee atau Tokopedia resmi Frasa Klausa Media | saya dapat membeli buku melalui marketplace yang saya percaya. |
| US-06 | Pengunjung | membaca artikel literasi, berita peluncuran, dan opini di halaman blog | saya mendapatkan wawasan dan informasi terbaru dari Frasa Klausa Media. |
| US-07 | Pengunjung | mencari buku atau artikel menggunakan search bar global | saya menemukan konten yang saya cari dengan cepat. |
| US-08 | Pengunjung | melihat halaman "Tentang Kami" | saya mengenal visi, misi, dan identitas Frasa Klausa Media. |
| US-09 | Pengunjung | mengirim pesan atau inquiry melalui halaman kontak | saya dapat menghubungi Frasa Klausa Media untuk pertanyaan atau kerja sama. |
| US-10 | Pengunjung | melihat banner promosi di atas navbar | saya mengetahui promo atau pengumuman terbaru. |

### Admin

| ID | Sebagai... | Saya ingin... | Agar... |
| :- | :--------- | :------------ | :------ |
| US-11 | Admin | login ke dashboard CMS dengan aman | saya dapat mengelola konten website. |
| US-12 | Admin | melihat ringkasan metrik (total buku, kategori, artikel, banner aktif) di dashboard | saya memahami status konten website secara keseluruhan. |
| US-13 | Admin | menambah, mengedit, dan menghapus data buku beserta cover, galeri, dan spesifikasi | katalog buku selalu terbaru dan akurat. |
| US-14 | Admin | mengelola kategori buku (CRUD) | pengunjung dapat menjelajahi buku berdasarkan kategori yang terorganisir. |
| US-15 | Admin | menulis, mengedit, dan menghapus artikel blog dengan rich text editor | konten literasi website selalu segar dan berkualitas. |
| US-16 | Admin | mengatur banner promosi berjadwal (konten, tautan, jadwal tayang, toggle aktif) | promosi tayang otomatis sesuai jadwal tanpa intervensi manual. |
| US-17 | Admin | mengedit konten halaman publik (Hero, Tentang Kami, Kontak) tanpa menyentuh kode | saya dapat memperbarui tampilan website secara mandiri. |
| US-18 | Admin | mengatur link checkout per buku (WhatsApp, Shopee, Tokopedia) | setiap buku memiliki jalur pemesanan yang sesuai. |
| US-19 | Admin | mengelola profil pribadi (ubah password, nama, avatar) | akun saya aman dan teridentifikasi dengan benar. |
| US-20 | Admin | melihat dan mengelola pesan inquiry dari form kontak publik | pertanyaan dan tawaran kerja sama pembaca dapat ditindaklanjuti secara terorganisir. |

### Super Admin

| ID | Sebagai... | Saya ingin... | Agar... |
| :- | :--------- | :------------ | :------ |
| US-21 | Super Admin | membuat akun admin baru dengan email dan password sementara | tim baru dapat langsung mengakses dan mengelola CMS tanpa kendala setup SMTP di awal. |
| US-22 | Super Admin | mengatur status aktif/nonaktif akun admin dan reset kredensial | keamanan akses dashboard terjaga. |
| US-23 | Super Admin | mengakses halaman pengaturan sistem | konfigurasi global dan integrasi pihak ketiga dapat dikontrol. |
| US-24 | Super Admin | melakukan semua operasi yang bisa dilakukan Admin | saya memiliki kontrol penuh atas seluruh konten website. |

---

## 4. Tech Stack & Ekosistem

### 4.1 Ringkasan Teknologi

| Komponen | Teknologi | Keterangan |
| :------- | :-------- | :--------- |
| **Framework** | Next.js (App Router, React) | SSR/SSG untuk performa optimal dan SEO |
| **Bahasa** | TypeScript | Type safety dan skalabilitas kode |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **UI Components** | shadcn/ui (Radix UI) | Komponen UI accessible, konsisten, dan modular |
| **Backend & Database** | Supabase | PostgreSQL, Auth, Storage, Row-Level Security (RLS) |
| **Deployment & Hosting** | Vercel | CI/CD otomatis, edge network, serverless runtime |
| **Tooling & Integrasi** | Context7 / MCP | Standarisasi konteks dan automasi AI/MCP |
| **Package Manager** | NPM | **Gunakan NPM saja**, bukan pnpm atau yarn |

### 4.2 Versi & Library Detail

- `next` 16.x (v16.4.x, App Router) sebagai framework aplikasi.
- `react` 19.x / 19.2.x dan `react-dom` 19.x untuk membangun UI.
- Node.js LTS (>= 20.9.0, disarankan Node v22 LTS) sebagai prasyarat runtime Next.js 16.
- `typescript` untuk type safety.
- `tailwindcss` 4 dan `@tailwindcss/typography` untuk styling utility dan tipografi artikel.
- `shadcn`, `radix-ui`, `cmdk`, dan `lucide-react` (sebagai library ikon standar tunggal untuk website publik dan CMS, terintegrasi mulus dengan shadcn/ui) untuk komponen UI dan modal.
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image` untuk Rich Text Editor.
- `isomorphic-dompurify` (atau `dompurify`) untuk sanitasi output HTML editor sebelum dirender.
- `@supabase/ssr` dan `@supabase/supabase-js` untuk integrasi Supabase.
- `@tanstack/react-query` untuk data fetching dan cache di sisi klien.
- `@tanstack/react-table` untuk tabel data admin.
- `zustand` untuk global state yang ringan.
- `react-hook-form`, `@hookform/resolvers`, dan `zod` untuk form dan validasi.
- `recharts` untuk chart pada dashboard.
- `sonner` untuk toast notification.
- `next-themes` untuk pengelolaan tema (light/dark/system). Jangan memakai `@teispace/next-themes` bersamaan agar tidak terjadi konflik provider.

> Pastikan seluruh UI pada website menggunakan komponen shadcn. Peta lokasi di halaman kontak/tentang kami v1.0 menggunakan Google Maps Embed responsif / link resmi tanpa dependensi library peta berat seperti `maplibre-gl` guna menjaga performa dan Core Web Vitals.

### 4.2.1 Matriks Kompatibilitas & Kontrak Integrasi Antar-Teknologi

Seluruh teknologi yang digunakan telah diverifikasi terhadap NPM registry dan dokumentasi resmi untuk memastikan dukungan penuh tanpa konflik dependensi (*zero peer dependency conflicts*):

| Paket / Library | Versi Terverifikasi | Kompatibilitas React 19 | Kompatibilitas Next.js 16 & Tailwind v4 | Status |
| :-------------- | :------------------ | :---------------------- | :--------------------------------------- | :----- |
| `next` | `^16.4.x` | Native (React 19.2 App Router) | Framework Core | ✅ Lolos |
| `react` & `react-dom` | `^19.2.x` | Core UI Library | Native | ✅ Lolos |
| `tailwindcss` | `^4.0.x` | Netral (CSS Engine) | Menggunakan `@tailwindcss/postcss` | ✅ Lolos |
| `@tailwindcss/typography` | `^0.5.16` | Netral | Didukung via `@plugin "@tailwindcss/typography"` | ✅ Lolos |
| `shadcn/ui` / Radix UI | Radix UI primitives | `^19.0.0` (resmi didukung) | Mode Tailwind v4 (`config: ""` di `components.json`) | ✅ Lolos |
| `@supabase/ssr` | `^0.9.x` | Netral (Server/Client) | Async `cookies()` via `getAll` & `setAll` | ✅ Lolos |
| `@supabase/supabase-js` | `^2.49.x` | Netral | Native | ✅ Lolos |
| `@tanstack/react-query` | `^5.69.x` | `^18 \|\| ^19` | Hydration Boundary Server Component | ✅ Lolos |
| `@tanstack/react-table` | `^8.21.x` | `>=18` (termasuk 19) | Client Component boundary | ✅ Lolos |
| `zustand` | `^5.0.x` | `>=18.0.0` (React 19 native) | Client state only | ✅ Lolos |
| `react-hook-form` | `^7.55.x` | `^18 \|\| ^19` | Integrasi via `@hookform/resolvers/zod` | ✅ Lolos |
| `@hookform/resolvers` | `^4.1.x` | Netral | Mendukung `zod: ^3.25 \|\| ^4.0` | ✅ Lolos |
| `zod` | `^3.24.x` | Netral | Validasi schema client & server | ✅ Lolos |
| `@tiptap/react` & starter | `^2.11.x` | `^17 \|\| ^18 \|\| ^19` | Wajib Client Component (`ssr: false`) | ✅ Lolos |
| `isomorphic-dompurify` | `^2.22.x` | Netral | Aman untuk SSR & Client | ✅ Lolos |
| `recharts` | `^2.15.x` | `^18.0.0 \|\| ^19.0.0` | Wajib Client Component (`'use client'`) | ✅ Lolos |
| `cmdk` | `^1.1.x` | `^18 \|\| ^19` | Modal Command Dialog | ✅ Lolos |
| `next-themes` | `^0.4.x` | `^18 \|\| ^19` | Terhubung ke `@custom-variant dark` di CSS | ✅ Lolos |
| `sonner` | `^2.0.x` | `^18 \|\| ^19` | Toast responsif di root layout | ✅ Lolos |
| `lucide-react` | `^1.16.x` | Netral (React 19 ready) | Ikon antarmuka utama | ✅ Lolos |

#### 4 Aturan Kontrak Integrasi Wajib:
1. **Next.js 16 + Supabase SSR**: Fungsi `cookies()` bersifat asynchronous (`await cookies()`). Gunakan overload modern `createServerClient` dengan metode `getAll()` dan `setAll()`. Tangani error penulisan cookie pada Server Component dalam blok `try/catch`.
2. **Tailwind CSS v4 + shadcn/ui + next-themes**: Tailwind CSS v4 tidak memerlukan `tailwind.config.ts`. Di `components.json`, atur `"tailwind": { "config": "" }`. Definisikan tema menggunakan `@theme inline` dan `@custom-variant dark (&:is(.dark *))` di `src/app/globals.css`.
3. **Batas Client Component (*Client Boundaries*)**: Komponen yang mengakses objek peramban (`window`, DOM, ResizeObserver) seperti Tiptap Editor dan Recharts wajib diisolasi dalam Client Component. Tiptap diimpor dinamis dengan `next/dynamic({ ssr: false })` pada form admin.
4. **Validasi Formulir (React Hook Form + Zod)**: Schema Zod didefinisikan secara terpusat di `src/validations/`. Schema ini diintegrasikan ke formulir client via `useForm({ resolver: zodResolver(...) })` dan dieksekusi ulang secara ketat di sisi server pada setiap Server Action atau Route Handler.

### 4.3 Variabel Lingkungan

Contoh konfigurasi variabel lingkungan tersedia di `env.example`.

Variabel utama:

- `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key Supabase untuk klien dan session server biasa.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key untuk operasi admin di sisi server.

### 4.4 Migrasi SQL Supabase

Gunakan penomoran berurutan untuk file migrasi:

- `src/migrations/001_...`: membuat tabel atau perubahan skema pertama.
- `src/migrations/002_...`: membuat tabel atau perubahan skema berikutnya.
- Lanjutkan dengan pola penomoran yang sama untuk migrasi berikutnya.

### 4.5 Struktur Folder Proyek

```text
.
|-- docs/
|-- note/
|-- public/
|   |-- flag/
|   `-- logo/
|-- src/
|   |-- actions/
|   |-- app/
|   |   |-- (admin)/
|   |   |-- (auth)/
|   |   |-- (public)/
|   |   |-- _components/
|   |   `-- api/
|   |-- components/
|   |   |-- common/
|   |   `-- ui/
|   |-- configs/
|   |-- constants/
|   |-- hooks/
|   |-- lib/
|   |   `-- supabase/
|   |-- migrations/
|   |-- providers/
|   |-- stores/
|   |-- types/
|   |-- validations/
|   `-- middleware.ts
|-- env.example
|-- next.config.ts
|-- package.json
`-- tsconfig.json
```

File penting di root:

- `package.json`: script dan dependency.
- `next.config.ts`: konfigurasi Next.js (remote patterns Supabase, security headers; di Next.js 16 opsi `eslint: {}` tidak lagi digunakan).
- `tsconfig.json`: konfigurasi TypeScript dan alias `@/*`.
- `components.json`: konfigurasi Shadcn UI.
- `env.example`: contoh environment variable.
- `.env.local`: environment variable lokal, tidak boleh dibagikan.

### 4.6 Penjelasan Folder Penting

- `src/app/`: folder App Router. Route menjadi aktif jika memiliki `page.tsx` atau `route.ts`.
- `src/app/(public)/`: route group untuk halaman publik. Nama `(public)` tidak muncul di URL.
- `src/app/(auth)/`: route group untuk halaman login.
- `src/app/(admin)/`: route group untuk dashboard admin. Nama `(admin)` tidak muncul di URL.
- `src/app/api/`: route handler API internal.
- `src/actions/`: Server Actions global, seperti sign out dan storage action.
- `src/components/common/`: komponen reusable yang dekat dengan kebutuhan aplikasi.
- `src/components/ui/`: komponen dasar UI dari Shadcn/Radix.
- `src/configs/`: konfigurasi aplikasi, terutama pembacaan env.
- `src/constants/`: initial state, daftar role, header tabel, dan konstanta domain.
- `src/hooks/`: custom hook.
- `src/lib/supabase/`: client, server client, dan middleware Supabase.
- `src/migrations/`: SQL schema dan trigger untuk Supabase.
- `src/providers/`: provider global React Query dan auth store.
- `src/stores/`: Zustand store untuk auth dan berita.
- `src/types/`: tipe TypeScript domain.
- `src/validations/`: schema validasi Zod.
- `public/`: aset statis yang bisa diakses langsung dari URL.
- `docs/`: catatan dan dokumentasi internal proyek.

---

## 5. Hak Akses & Peran Pengguna

Sistem membedakan akses ke dalam 3 entitas utama. **Tidak ada registrasi atau login untuk pengunjung publik.**

| Peran | Ruang Lingkup | Hak Akses Utama |
| :---- | :------------ | :-------------- |
| **Publik (Pengunjung)** | Halaman Publik | Melihat katalog buku, membaca blog, mencari konten, menghubungi lewat kontak, dan melakukan pemesanan via WhatsApp/Shopee/Tokopedia. **Tidak perlu login.** |
| **Admin** | Dashboard CMS | CRUD Produk, CRUD Kategori, CRUD Blog, mengedit konten halaman publik, mengelola banner promo. |
| **Super Admin** | Seluruh Sistem | Seluruh hak akses Admin + Manajemen Akun Pengguna (tambah/hapus Admin) + Akses Halaman Pengaturan Sistem. **Hanya Super Admin yang dapat membuat akun Admin baru.** |

---

## 6. Kebutuhan Fungsional

### 6.1 Autentikasi & Akun

- **Akses Login:** Khusus untuk `admin` dan `super_admin`. **Tidak ada registrasi atau login untuk pengunjung publik.**
- **Manajemen Pengguna (Khusus Super Admin):**
  - Membuat akun admin baru langsung di modal/form CMS dengan memasukkan email dan password sementara (via Server Action menggunakan `supabase.auth.admin.createUser()`). Akun langsung berstatus aktif dan siap digunakan tanpa ketergantungan konfigurasi server email SMTP di tahap awal.
  - Mengatur status aktif/nonaktif akun dan reset kredensial.
  - **Hanya Super Admin yang memiliki hak untuk membuat akun Admin.**
- **Halaman Profil:** Manajemen profil pribadi masing-masing admin (ubah password, nama, avatar).
- **Halaman Pengaturan (Khusus Super Admin):** Konfigurasi global sistem, kontak/sosmed default, integrasi pihak ketiga, dan pengaturan lanjutan platform.

---

### 6.2 Dashboard & Manajemen Konten (CMS)

#### A. Tampilan Dashboard

- Ringkasan metrik utama: total judul buku, kategori, artikel blog, banner aktif, dan jumlah pesan kontak belum dibaca.
- **UX Sidebar State & Cookies Persistence:** Status buka/tutup (_collapsed/expanded_) sidebar admin wajib disimpan di **cookies browser** (bukan *localStorage*), dengan default terbuka. Preferensi status ini bertahan saat berpindah halaman maupun saat pengguna membuka sesi login berikutnya (_persistent state_).
- **Isolasi Refresh Sidebar:** Ketika halaman admin di-refresh, sidebar admin **tidak ikut refresh**, tidak kembali ke state collapse default, dan tidak mengalami kedipan (_no layout shift / flickering_), karena status dibaca langsung dari cookies pada saat server-side rendering (SSR).
- **Responsivitas Sidebar (Mobile):** Sidebar admin harus 100% responsif. Pada tampilan layar mobile (< breakpoint desktop), sidebar bertransformasi menjadi *drawer / sheet* yang **slide-out dari sisi kiri** layar ketika tombol menu (hamburger) ditekan, dan otomatis tertutup setelah navigasi atau ketika overlay diklik.

#### B. Sticky Banner Promosi Berjadwal

- Banner pengumuman sticky di bagian atas navbar halaman publik.
- **Pengaturan Admin:**
  - Konten teks pengumuman/promo.
  - Tautan tujuan (bisa diarahkan langsung ke detail buku tertentu atau artikel blog).
  - Penjadwalan tanggal & jam (rentang waktu mulai dan selesai tayang).
  - Toggle aktif/nonaktif manual.

#### C. Manajemen Konten Halaman Publik (Page CMS)

- Kemampuan mengubah elemen teks dan media di halaman publik tanpa menyentuh kode:
  - Bagian Hero (Headline, Sub-headline, CTA button, gambar).
  - Profil & Halaman "Tentang Kami".
  - Informasi kontak dan media sosial.

#### D. Manajemen Kategori Produk (Buku)

- CRUD data kategori buku tersimpan di tabel khusus **`book_categories`** (misal: Fiksi, Sastra Klasik, Non-Fiksi, Puisi, dll.).
- Pengaturan slug URL otomatis dan SEO meta kategori buku.

#### E. Manajemen Produk Buku

Mendukung penuh operasi CRUD dengan field data komprehensif:

- **Informasi Pokok:**
  - Judul Buku
  - Slug URL
  - Deskripsi / "Tentang Buku" menggunakan **Tiptap Rich Text Editor**
  - Cover Buku & Galeri Foto
  - Kategori Buku (relasi ke tabel `book_categories`)
- **Spesifikasi & Rincian Buku:**
  - Penulis (Author)
  - Editor
  - Penerbit (Publisher)
  - Tahun Terbit
  - Nomor ISBN
  - Jumlah Halaman
- **Penetapan Harga:**
  - Harga Normal (Reguler)
  - Harga Promo / Diskon (opsional)
- **Rekomendasi Terkait:**
  - Pemilihan relasi manual atau otomatis untuk daftar "Buku Terkait" di halaman detail.
- **Multi-Channel Checkout Settings:**
  - Link Pembelian Shopee (opsional per buku)
  - Link Pembelian Tokopedia (opsional per buku)
  - Pengaturan Nomor WhatsApp Checkout (default: `0813-8060-4256`) dengan template pesan otomatis.

#### F. Manajemen Blog

- CRUD artikel literasi, berita peluncuran, dan opini.
- Menggunakan **Tiptap Rich Text Editor** (heading, paragraf, gambar, blockquote, link) dengan sanitasi HTML aman (`isomorphic-dompurify`).
- Kategori blog tersimpan di tabel khusus **`blog_categories`** (terpisah dari kategori buku).
- Kolom nama penulis `author_name` (default otomatis mengambil nama admin yang login, namun dapat diubah bebas bila memuat tulisan kontributor/penulis tamu).
- Tanggal publikasi, cover thumbnail, dan SEO metadata.

#### G. Manajemen Pesan Kontak (Inbox Inquiries)

- Melihat daftar pesan/inquiry yang dikirimkan oleh pengunjung melalui form kontak publik.
- Data tersimpan di tabel **`contact_inquiries`** dengan kolom status: `unread`, `replied`, dan `archived`.
- Filter pesan berdasarkan status penanganan, pencarian pengirim/subjek, dan aksi pembaruan status oleh Admin.

---

### 6.3 Halaman Publik (Frontend)

1. **Header & Sticky Banner:**
   - Sticky banner promo paling atas (jika dalam jadwal aktif).
   - Navbar utama: Logo Frasa Klausa Media, menu navigasi, search bar global / shortcut modal (`Ctrl + K`), dan link cepat.
2. **Halaman Beranda (Home):**
   - Hero Section dengan CTA dinamis.
   - Sorotan Buku Unggulan / Rilis Terbaru.
   - Sorotan Kategori Populer.
   - Artikel Blog Terbaru.
   - Sekilas Tentang Frasa Klausa Media.
3. **Katalog & Halaman Kategori:**
   - Grid kartu buku dengan informasi judul, penulis, cover, dan harga.
   - Sistem filter terintegrasi (berdasarkan kategori buku, rentang harga, dsb.).
4. **Halaman Detail Produk (Buku):**
   - Galeri foto / cover buku berkualitas tinggi.
   - Informasi judul, badge promo, perbandingan harga normal & promo.
   - Bagian "Tentang Buku" yang nyaman dibaca (render HTML Tiptap via Tailwind `prose`).
   - Tabel spesifikasi terstruktur (Penulis, Editor, Penerbit, Tahun Terbit, ISBN, Halaman).
   - **Tombol Aksi Checkout Multi-Kanal:**
     - WhatsApp (pesan otomatis: `Halo Frasa Klausa Media, saya ingin memesan buku "[Judul Buku]" seharga [Harga]. Apakah stok masih tersedia?` ke nomor resmi).
     - Shopee (direct link ke toko resmi/produk).
     - Tokopedia (direct link ke toko resmi/produk).
     - _Validasi Fallback:_ Tombol Shopee atau Tokopedia otomatis **disembunyikan (hidden)** jika URL belum diisi oleh admin agar tampilan tetap bersih dan menghindari dead click bagi calon pembeli.
   - Rekomendasi "Buku Terkait" (_Related Books_).
5. **Halaman Blog:**
   - Daftar artikel dengan paginasi/infinite scroll, filter kategori blog, dan pencarian artikel.
   - Halaman baca artikel dengan tipografi teroptimasi (`prose`), waktu baca (_read time_), nama penulis, dan navigasi artikel terkait.
6. **Halaman Tentang Kami:**
   - Sejarah, visi, misi, dan identitas penerbit/media Frasa Klausa Media.
7. **Halaman Kontak:**
   - Menampilkan detail kontak resmi dan form pesan/inquiry (tersimpan ke database `contact_inquiries` dengan perlindungan rate limit IP dan honeypot).
   - Peta lokasi kantor menggunakan Google Maps Embed responsif / link resmi tanpa dependensi library peta berat.
8. **Pencarian Global (Global Search - Command Dialog `Ctrl + K`):**
   - Menggunakan Command Dialog modal (shadcn `Command` / `cmdk`) yang dapat dibuka via shortcut `Ctrl + K` atau klik ikon search navbar.
   - Dilengkapi debounce 300ms untuk mencari dan menampilkan preview instan judul buku, cover, harga, serta artikel blog terkelompok secara cepat tanpa berpindah halaman.
9. **Footer Publik:**
   - Menampilkan identitas resmi penerbit, navigasi cepat, kontak, dan tautan media sosial Frasa Klausa Media.
   - **Copyright Dinamis:** Wajib mencantumkan format `[Company Name] © [tahun]` (contoh: `Frasa Klausa Media © 2026`), di mana `[tahun]` otomatis berubah mengikuti tahun berjalan (`current year`) secara dinamis di runtime/SSR tanpa di-hardcode.

---

## 7. Integrasi Checkout & Pemesanan

Sistem menyediakan opsi pemesanan fleksibel melalui kanal eksternal. **Versi 1.0 tidak menggunakan payment gateway.**

- **Marketplace External:** Direct link ke official store di Shopee dan Tokopedia.
- **WhatsApp Order:** Mengarahkan ke WhatsApp resmi (default: `0813-8060-4256`) dengan template pesan otomatis terformat:
  `Halo Frasa Klausa Media, saya ingin memesan buku "[Judul Buku]" seharga [Harga]. Apakah stok masih tersedia?`
- **Fallback Rule:** Tombol channel marketplace (Shopee atau Tokopedia) yang tidak memiliki URL dari dashboard admin akan otomatis **disembunyikan (hidden)** agar menjaga UX pembeli tetap bersih dan fokus pada channel pemesanan yang aktif.

> **Catatan v2.0:** Integrasi payment gateway (dengan pengecekan status transaksi real-time menggunakan SSE, bukan polling) direncanakan untuk versi 2.0.

---

## 8. Identitas Resmi & Kontak

Data default sistem untuk identitas Frasa Klausa Media:

- **Nomor Telepon / WhatsApp:** `0813-8060-4256`
- **Email Resmi:** `frasaklausamedia@gmail.com`
- **Contoh Akun Admin:** `admin1@frasaklausamedia.com`

---

## 9. Arsitektur & Rendering

### 9.1 App Router & Rendering

- Gunakan App Router pada `src/app`.
- Gunakan Server Component sebagai default.
- Tambahkan `'use client'` hanya ketika komponen benar-benar membutuhkan state React, lifecycle/effect, event handler interaktif, browser API, atau library yang hanya dapat berjalan di browser.
- Jaga batas Client Component sekecil mungkin agar JavaScript yang dikirim ke browser tidak membesar tanpa kebutuhan.
- Jangan mengubah seluruh page atau layout menjadi Client Component hanya karena satu bagian kecil membutuhkan interaktivitas; pisahkan bagian tersebut menjadi komponen client tersendiri.
- Data yang dapat diambil di server sebaiknya diambil langsung di Server Component, server utility, atau data-access layer.
- Gunakan `loading.tsx`, `error.tsx`, `not-found.tsx`, dan Suspense secara tepat untuk pengalaman loading/error yang jelas.
- Gunakan route group seperti `(admin)`, `(auth)`, dan `(public)` untuk organisasi route, bukan sebagai mekanisme authorization.
- Jangan mengandalkan layout, menu tersembunyi, redirect client-side, atau route group sebagai kontrol akses keamanan.
- Pilih static rendering, dynamic rendering, cache, dan revalidation sesuai karakter data; jangan memaksa semua halaman menjadi dynamic tanpa alasan.
- Hindari pemanggilan API internal melalui HTTP dari Server Component apabila data/function yang sama dapat dipanggil langsung dari server code.

### 9.2 Penerapan SSR (Server-Side Rendering)

- **Menerapkan SSR pada halaman dashboard admin dan halaman publik.**
- **Persistent Layout:** Buat persistent layout untuk komponen **Navbar** dan **Sidebar** agar tidak ikut re-render atau loading saat navigasi antar halaman.
- **SSR Cookie Hydration Sidebar:** Pada layout admin `(admin)/layout.tsx`, status buka/tutup sidebar dibaca langsung dari cookies browser via `cookies()` di Server Component, kemudian diteruskan sebagai initial state (`defaultOpen`) ke UI context (`SidebarProvider`). Hal ini menjamin bahwa HTML yang dikirim ke browser sudah memuat dimensi dan state sidebar yang presisi, sehingga saat page di-refresh, sidebar **tidak ikut me-refresh**, tidak kembali collapse, dan terbebas dari *layout shift* atau efek berkedip (*flash*).
- **Loading Skeleton:** Perbaiki semua loading skeleton agar dimensi, proporsi, dan posisinya **persis menyesuaikan** dengan komponen asli yang sedang dimuat.

### 9.3 Data Access Layer

- Pusatkan query dan aturan akses data yang sensitif pada server-side data-access layer di `src/lib`, `src/actions`, atau modul domain yang sesuai.
- Pisahkan query database dari presentational component.
- Untuk data sensitif, kembalikan hanya field yang diperlukan oleh UI; hindari mengirim seluruh record ke client.
- Hindari `select('*')` untuk data sensitif atau tabel besar. Pilih kolom secara eksplisit ketika memungkinkan.
- Authorization harus dicek sedekat mungkin dengan operasi data atau mutation, bukan hanya pada level halaman.
- Gunakan helper authorization yang reusable untuk aturan role/permission yang digunakan berulang.

---

## 10. Pedoman Frontend

### 10.1 Komponen UI

- Gunakan komponen dari shadcn sebagai fondasi UI website.
- Komponen reusable lintas halaman ditempatkan pada `src/components/common`.
- Komponen primitive/generik shadcn ditempatkan pada `src/components/ui`.
- Komponen yang hanya digunakan oleh satu route dapat ditempatkan dekat route tersebut, misalnya di folder `_components`.
- Hindari membuat ulang button, dialog, dropdown, input, tooltip, sheet, tabs, table primitive, atau komponen dasar lain apabila versi shadcn/Radix sudah tersedia.
- Gunakan `lucide-react` secara konsisten di seluruh antarmuka publik dan CMS Admin. Jangan mencampur pustaka ikon lain tanpa alasan desain.
- Setiap komponen harus mempunyai tanggung jawab yang jelas dan tidak terlalu besar.
- Pecah komponen ketika logic, markup, atau state sudah sulit dibaca atau memiliki bagian reusable yang jelas.
- Hindari prop drilling yang panjang; pilih composition, context lokal, atau state store hanya ketika memang diperlukan.

### 10.2 Navigasi

- Pastikan navigasi internal menggunakan client-side navigation atau client-side routing.
- Gunakan `next/link` untuk navigasi internal berbasis link.
- Gunakan router dari Next.js hanya untuk navigasi imperatif yang memang diperlukan setelah action tertentu.
- Jangan menggunakan `window.location` untuk navigasi internal kecuali benar-benar membutuhkan full page reload.
- Pertahankan state yang layak dibagikan/bookmark seperti pencarian, filter, sorting, pagination, tab penting, atau rentang tanggal di URL apabila relevan.
- Validasi semua query parameter dan route parameter sebelum digunakan.
- Redirect yang menerima target dari user harus menggunakan allowlist/path internal untuk mencegah open redirect.

### 10.3 Responsive Design

- Gunakan pendekatan mobile-first.
- Pastikan UI dapat digunakan minimal pada mobile kecil, tablet, laptop, dan desktop lebar.
- Hindari lebar fixed yang menyebabkan horizontal scroll pada mobile.
- **Sidebar Admin Responsif:** Pada tampilan layar mobile (< breakpoint desktop), sidebar admin bertransformasi menjadi *drawer/sheet* yang meluncur keluar (**slide out**) dari sisi **kiri** layar saat tombol toggle/hamburger di navbar ditekan, dapat ditutup kembali dengan swipe, tombol tutup, atau klik pada overlay.
- Table admin harus memiliki strategi responsive yang jelas, misalnya horizontal scroll, column visibility, atau layout alternatif.
- Pastikan dialog, sheet, dropdown, tooltip, popover, dan menu tetap dapat digunakan pada layar kecil.
- Gunakan spacing, typography, dan breakpoint secara konsisten.

### 10.4 Form

- Gunakan `react-hook-form` untuk form kompleks atau form yang membutuhkan state/validation client yang terstruktur.
- Gunakan `zod` sebagai schema validasi bersama bila memungkinkan.
- Validasi client digunakan untuk UX, tetapi validasi server tetap wajib untuk data yang akan diproses/disimpan.
- Tampilkan error pada field yang relevan dan sediakan pesan error yang dapat dipahami pengguna.
- Disable atau beri loading state pada submit untuk mencegah submit ganda.
- Mutation yang tidak idempotent harus dilindungi dari eksekusi ganda pada UI dan server bila relevan.
- Jangan memasukkan data sensitif ke query string.
- Jangan menampilkan nilai secret, token, credential, atau data internal dalam error form.

### 10.5 State Management

- Gunakan state lokal React untuk state yang hanya dibutuhkan oleh satu komponen/subtree kecil.
- Gunakan URL state untuk filter, sort, search, pagination, dan state navigasi yang perlu dapat dibagikan atau dipulihkan.
- Gunakan `@tanstack/react-query` untuk server state di client yang membutuhkan cache, refetch, mutation, invalidation, polling, atau optimistic update.
- Gunakan Zustand hanya untuk global client state yang benar-benar lintas komponen dan tidak cocok sebagai server state atau URL state.
- Jangan menduplikasi data server yang sama ke React Query dan Zustand tanpa alasan kuat.
- Hindari menyimpan data sensitif di `localStorage` atau `sessionStorage`.

### 10.6 Data Fetching Client

- Jangan melakukan client-side fetch apabila data dapat dirender di server dengan lebih sederhana dan aman.
- Gunakan React Query pada halaman interaktif yang memang membutuhkan client cache/refetch.
- Tentukan query key secara konsisten dan stabil.
- Setelah mutation, invalidasi atau update cache yang relevan saja.
- Tangani loading, empty, error, stale, dan success state secara eksplisit.
- Batalkan atau abaikan request lama pada fitur search/filter yang cepat berubah bila diperlukan untuk mencegah race condition.
- Gunakan debounce pada input pencarian sesuai aturan yang sudah ada, tetapi jangan menambahkan debounce pada aksi yang perlu respons langsung tanpa alasan.

### 10.7 Gambar, Font, dan Asset

- Gunakan `next/image` untuk gambar yang mendapat manfaat dari optimasi Next.js.
- Tentukan dimensi/aspect ratio agar mengurangi layout shift.
- Gunakan `alt` yang deskriptif untuk gambar bermakna dan `alt=""` untuk gambar dekoratif.
- Validasi remote image host pada konfigurasi Next.js; jangan membuka pola host terlalu luas tanpa kebutuhan.
- Gunakan `next/font` bila sesuai agar font loading lebih optimal.
- Optimalkan file gambar sebelum dimasukkan ke `public` bila ukuran file besar.
- Jangan menyimpan file rahasia atau source file sensitif di folder `public`.

### 10.8 Tabel & Dashboard

- Gunakan `@tanstack/react-table` untuk tabel kompleks seperti sorting, filtering, selection, pagination, atau column visibility.
- Untuk dataset besar, gunakan pagination/filtering/sorting server-side daripada mengirim seluruh data ke browser.
- Jangan render ribuan row sekaligus tanpa pagination atau virtualization bila memang diperlukan.
- Chart harus memiliki label, tooltip, unit, legend, empty state, dan konteks periode data yang jelas.
- Jangan hanya mengandalkan warna untuk menyampaikan status atau kategori.
- Pastikan setiap tabel/data grid memiliki batas baris per halaman (_page size_) dan kontrol pagination.
- Batas baris bawaan (_default limit_) adalah **10**, tetapi harus mendukung opsi perubahan (misal: 25, 50, 100).
- Gunakan komponen pagination bawaan dari **shadcn/ui** untuk konsistensi UI/UX.
- Pastikan state pagination (seperti `page` dan `pageSize`) tersinkronisasi dengan URL query parameters jika diperlukan untuk shareability/bookmark.

### 10.9 Peta Lokasi (Map)

- Pada v1.0, peta lokasi kantor penerbit Frasa Klausa Media di halaman Kontak/Tentang Kami menggunakan Google Maps Embed iframe yang responsif dan tautan eksternal resmi, tanpa menginstal dependensi peta berat (`maplibre-gl`).
- Terapkan lazy-loading (`loading="lazy"`) pada iframe peta agar tidak membebani First Contentful Paint dan Core Web Vitals.
- Sediakan fallback teks alamat lengkap dan tombol navigasi langsung ke Google Maps / Waze.
- Jika di versi masa depan dibutuhkan fitur visualisasi geospasial kustom, barulah evaluasi library seperti `maplibre-gl` dengan pertimbangan bundle size.

### 10.10 Status Antarmuka

- Setiap operasi async yang terlihat user harus memiliki loading state yang masuk akal.
- Setiap list/table/chart harus memiliki empty state.
- Error state harus memberikan langkah yang dapat dilakukan user bila memungkinkan, misalnya retry atau kembali.
- Jangan menggunakan toast sebagai satu-satunya tempat untuk error field form yang perlu diperbaiki pengguna.
- Gunakan toast `sonner` untuk feedback global singkat seperti mutation berhasil/gagal, bukan untuk informasi permanen yang penting.
- Hindari toast bertumpuk berlebihan pada bulk operation.

### 10.11 Dark Mode & Tema

- Gunakan provider theme yang sudah dipilih project secara konsisten; hindari dua sistem theme yang saling bertabrakan pada satu subtree.
- Semua komponen baru harus diuji pada light dan dark mode.
- Jangan hardcode warna yang merusak semantic token/theme kecuali diperlukan oleh brand/data visualization.
- Pastikan chart, map overlay, focus state, border, muted text, dan error/success state tetap terbaca pada kedua mode.

---

## 11. Aksesibilitas

- Targetkan praktik WCAG 2.2 level AA untuk fitur utama.
- Gunakan elemen HTML semantik sebelum menambahkan role ARIA.
- Semua kontrol interaktif harus dapat digunakan dengan keyboard.
- Pastikan focus state terlihat jelas.
- Dialog, dropdown, popover, tabs, accordion, tooltip, dan menu harus menggunakan primitive Radix/shadcn yang mempertahankan perilaku aksesibel.
- Form input harus memiliki label yang terhubung dengan benar.
- Error form harus dapat diketahui pengguna screen reader bila relevan.
- Jangan menggunakan placeholder sebagai pengganti label utama.
- Pastikan kontras teks dan kontrol memadai pada light mode dan dark mode.
- Hormati `prefers-reduced-motion` untuk animasi yang tidak esensial.
- Hindari animasi yang mengganggu atau terlalu lama.
- Gunakan heading hierarchy (`h1` sampai `h6`) secara logis.
- Sediakan nama aksesibel untuk icon-only button menggunakan label yang sesuai.

---

## 12. TypeScript & Kualitas Kode

- Aktifkan dan pertahankan konfigurasi TypeScript yang ketat sesuai kemampuan project.
- Hindari `any`. Gunakan type spesifik, generic, `unknown`, atau schema parsing sesuai konteks.
- Jangan menggunakan type assertion untuk menutupi data yang belum divalidasi.
- Parse data eksternal sebelum dianggap memiliki type internal yang valid.
- Gunakan naming yang deskriptif dan konsisten.
- Hindari magic number/string; pindahkan ke constant/config apabila memiliki arti domain.
- Jangan membuat duplicate type untuk shape data yang sama tanpa alasan.
- Type khusus domain ditempatkan pada `src/types` atau dekat domain terkait apabila hanya digunakan lokal.
- Schema Zod ditempatkan pada `src/validations` atau dekat fitur jika hanya digunakan fitur tersebut.
- Jangan mengabaikan error TypeScript atau lint dengan komentar disable global tanpa alasan terdokumentasi.
- Hapus import, variable, function, dan dependency yang tidak digunakan.

### Kualitas Kode & Maintainability

- **Pemisahan Query Server & Client**: Pisahkan logic fetch data antara Server Component (atau Server Actions/Services) dan Client Component secara tegas agar mudah dibaca dan di-maintain.
- **Konsistensi Pola Logic**: Selalu gunakan arsitektur, penamaan, dan alur logic yang seragam pada setiap fitur.
- **Prinsip DRY (Don't Repeat Yourself)**: Hindari duplikasi fungsi/logic; abstraksikan helper function atau reusable hooks untuk kode yang sering digunakan.
- **Error Handling & Validation**: Terapkan _defensive programming_, validasi _input_ (client-side untuk UX, server-side untuk keamanan), dan _fallback state_ agar aplikasi tetap berjalan stabil meskipun terjadi kesalahan tak terduga.
- **State Management**: Gunakan state management yang sesuai dengan kompleksitas fitur (misal: `useState`/`useReducer` untuk state lokal, `useContext`/Zustand untuk global state, dan server state management seperti TanStack Query untuk data fetched).
- **Dokumentasi Inline**: Tambahkan komentar yang jelas untuk menjelaskan _logic_ yang kompleks atau _decision_ yang krusial, terutama pada bagian yang ambigu atau _edge case_.
- **Performance Optimization**: Perhatikan potensi _bottleneck_ pada query database (pastikan penggunaan index dan pagination yang efisien) dan render React (gunakan `React.memo`, `useCallback`, `useMemo` jika perlu untuk menghindari _unnecessary re-renders_).

---

## 13. Server Actions & Route Handlers

- Perlakukan Server Actions dan Route Handlers sebagai endpoint publik dari sudut pandang keamanan.
- Setiap action/handler yang membutuhkan login wajib memverifikasi session di server.
- Setiap action/handler sensitif wajib memverifikasi authorization/role/ownership di server.
- Jangan mengandalkan disabled button atau menu tersembunyi sebagai authorization.
- Validasi `FormData`, JSON body, path params, query params, dan header yang digunakan menggunakan schema yang jelas.
- Gunakan status HTTP yang sesuai pada Route Handler.
- Jangan mengembalikan stack trace, SQL error mentah, credential, token, atau detail infrastruktur kepada client.
- Gunakan response error yang konsisten dan aman.
- Terapkan rate limit pada endpoint yang rentan abuse, misalnya login, password reset, search mahal, upload, webhook, public mutation, dan endpoint yang memicu third-party API.
- Terapkan timeout atau batas kerja untuk operasi eksternal yang berpotensi menggantung.
- Pastikan webhook memverifikasi signature/secret dari provider sebelum memproses payload.
- Pertimbangkan idempotency key untuk webhook atau mutation penting yang berisiko dieksekusi ulang.

---

## 14. Supabase

### 14.1 Client Supabase

- Pisahkan helper Supabase untuk browser dan server pada `src/lib/supabase`.
- Browser hanya boleh menggunakan key yang memang aman untuk client seperti anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY` tidak boleh pernah dikirim ke client bundle, browser, log publik, analytics, atau response API.
- Jangan menamai module service-role dengan pola yang berpotensi di-import oleh Client Component.
- Gunakan service role hanya untuk operasi backend/admin yang benar-benar membutuhkan bypass RLS.

### 14.2 Row Level Security

- Aktifkan RLS pada semua tabel yang berada di schema yang diekspos ke Supabase Data API, terutama `public`.
- Buat policy eksplisit untuk operasi `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` sesuai kebutuhan.
- Gunakan prinsip least privilege: user hanya boleh membaca/mengubah row yang memang menjadi haknya.
- Untuk data multi-tenant, setiap query dan policy harus mempertimbangkan `tenant_id`, `organization_id`, atau ownership yang sesuai.
- Jangan hanya mengandalkan filter query aplikasi untuk membatasi row; RLS harus menjadi lapisan pertahanan database.
- Uji policy dengan role `anon` dan `authenticated`, bukan hanya dari SQL editor/admin.
- Tambahkan index pada kolom yang sering dipakai policy RLS atau filter besar agar authorization tidak menimbulkan query lambat.
- View yang mengekspos data harus ditinjau apakah mengikuti RLS; gunakan konfigurasi security yang tepat dan jangan mengasumsikan view otomatis aman.

### 14.3 Database Design

- Semua tabel utama harus memiliki primary key yang jelas.
- Gunakan foreign key untuk menjaga referential integrity.
- Gunakan `NOT NULL`, `UNIQUE`, `CHECK`, enum/domain, atau constraint lain bila aturan bisnis dapat dijaga di database.
- Gunakan timestamp yang konsisten, misalnya `created_at` dan `updated_at`, bila relevan.
- Simpan waktu dalam format/timestamp yang konsisten dan lakukan konversi timezone pada layer presentasi bila diperlukan.
- Hindari data redundant yang mudah tidak sinkron kecuali memang merupakan denormalization yang disengaja dan terdokumentasi.
- Tambahkan index berdasarkan pola query nyata, bukan hanya karena sebuah kolom terlihat penting.
- Hindari index berlebihan karena menambah biaya write dan storage.
- Gunakan pagination pada query list yang dapat tumbuh besar.
- Pilih keyset/cursor pagination untuk dataset sangat besar atau data yang sering berubah apabila offset pagination sudah menjadi bottleneck.
- Hindari N+1 query; gabungkan query atau gunakan relasi/RPC yang terkontrol bila lebih efisien.
- Jangan menjalankan operasi destruktif pada migration tanpa rencana migrasi/backfill/backup yang jelas.

### 14.4 Migration

- Pertahankan pola penomoran migration yang sudah ditentukan: `001_...`, `002_...`, dan seterusnya.
- Setiap perubahan schema produksi harus dibuat melalui migration yang dapat direview dan dilacak di Git.
- Jangan mengedit migration yang sudah pernah dijalankan di environment bersama/production; buat migration baru.
- Nama migration harus menjelaskan perubahan, misalnya `003_add_orders_status_index.sql`.
- Pisahkan perubahan schema besar menjadi tahap aman bila membutuhkan backfill data.
- Untuk perubahan kolom besar: tambah struktur baru, backfill, pindahkan pembacaan/penulisan, lalu hapus struktur lama pada migration terpisah bila diperlukan.
- Migration harus mempertimbangkan lock table dan dampak pada traffic production.

### 14.5 Storage

- Terapkan policy akses untuk bucket/file Supabase Storage sesuai ownership dan role.
- Jangan membuat bucket public untuk data private hanya demi kemudahan implementasi.
- Gunakan signed URL dengan masa berlaku terbatas untuk file private apabila diperlukan.
- Validasi tipe file, ukuran, ekstensi, dan konten dasar pada upload.
- Jangan mempercayai MIME type yang dikirim browser sebagai satu-satunya validasi.
- Gunakan nama object yang aman dan tidak bergantung pada nama file user secara mentah.
- Hindari eksekusi/serving file user dengan content type yang dapat membuka risiko script injection.
- Setelah file berhasil di upload ke Supabase Storage, link file tersebut wajib di-set di database yang sesuai. Jika gagal menyimpan link file ke database, maka hapus file tersebut dari Supabase Storage agar tidak terjadi penumpukan file sampah pada storage.

### 14.6 Anti Auto-Pause (Keep-Alive)

- Membuat API route baru di Next.js (`/api/keep-alive`) yang melakukan satu query baca (read) sangat ringan ke Supabase, misalnya melakukan `SELECT 1` baris data dari tabel bebas.
- Buatkan konfigurasi `vercel.json` untuk mengatur **Vercel Cron Job** yang memanggil endpoint `/api/keep-alive` tersebut secara otomatis **setiap 5 hari sekali**.
- Tujuannya adalah untuk melakukan aktivitas database minimal agar proyek Supabase tidak terkena auto-pause.

---

## 15. Keamanan Web

### 15.1 Secret & Environment Variable

- File `.env.local` tidak boleh masuk Git.
- `env.example` hanya berisi nama variable dan contoh nilai yang tidak sensitif.
- Variable dengan prefix `NEXT_PUBLIC_` dianggap dapat terekspos ke browser dan tidak boleh berisi secret.
- Secret production harus disimpan pada secret manager/environment platform deployment.
- Rotasi key/token apabila ada kemungkinan bocor.
- Jangan menulis secret ke log, toast, error UI, analytics, monitoring breadcrumb, atau exception metadata.
- Jangan mengekspos `process.env` secara menyeluruh ke client.

### 15.2 Authentication & Session

- Verifikasi session pada server untuk halaman/action/handler yang membutuhkan autentikasi.
- Bedakan authentication (siapa user) dan authorization (apa yang boleh dilakukan user).
- Untuk operasi sensitif, cek authorization berdasarkan data terbaru di server/database.
- Jangan mempercayai role, user id, tenant id, harga, status transaksi, atau permission yang dikirim dari client tanpa verifikasi server.
- Cookie session yang dikelola aplikasi harus menggunakan pengaturan aman seperti `HttpOnly`, `Secure` pada production, dan `SameSite` yang sesuai dengan alur aplikasi.
- Jangan menyimpan access token sensitif di `localStorage` apabila dapat menggunakan mekanisme session/cookie yang lebih aman.
- Terapkan proteksi brute-force/rate limit pada login dan flow auth sensitif.
- Aktifkan CAPTCHA/bot protection jika abuse nyata atau risiko login tinggi.
- Pertimbangkan MFA untuk role admin atau operasi kritikal.

### 15.3 Authorization

- Gunakan deny-by-default untuk resource sensitif.
- Selalu cek ownership/tenant membership/role pada server sebelum read atau mutation sensitif.
- Hindari authorization hanya berdasarkan route seperti `/admin`; data dan action tetap harus melakukan pemeriksaan sendiri.
- Jangan mengambil `user_id` target dari client untuk operasi "milik saya" apabila ID tersebut dapat ditentukan dari session server.
- Untuk admin action, log actor, target, waktu, dan hasil secara aman bila audit trail diperlukan.

### 15.4 Validasi Input

- Validasi semua input tidak tepercaya di server, termasuk body, form, query string, route param, cookie yang dibaca, header tertentu, webhook, dan data third-party.
- Utamakan allowlist untuk enum, sort field, filter field, redirect path, file type, dan parameter yang memiliki pilihan terbatas.
- Terapkan validasi sintaks dan semantik, misalnya tanggal valid serta `start_date <= end_date`.
- Batasi panjang string, ukuran array, angka minimum/maksimum, dan kedalaman object untuk mencegah input berlebihan.
- Normalisasi input hanya jika aturan normalisasi jelas dan tidak mengubah arti data tanpa disadari.
- Jangan membangun SQL mentah dengan interpolasi string dari input user.

### 15.5 XSS & Content Injection

- Hindari `dangerouslySetInnerHTML`.
- Bila HTML dari user/third-party harus dirender, sanitasi menggunakan library yang memang dirancang untuk sanitasi HTML dan gunakan allowlist tag/attribute.
- Jangan memasukkan input user langsung ke script, style, HTML attribute berbahaya, atau URL tanpa encoding/validasi sesuai konteks.
- Tinjau semua renderer Markdown/HTML agar tidak mengizinkan script atau URL berbahaya.
- Gunakan Content Security Policy sebagai lapisan pertahanan tambahan, bukan sebagai pengganti sanitasi dan output encoding.

### 15.6 CSRF

- Mutation yang menggunakan cookie/session harus mempertimbangkan risiko CSRF.
- Gunakan `SameSite` cookie yang sesuai, verifikasi origin/host pada endpoint sensitif bila diperlukan, dan gunakan mekanisme anti-CSRF untuk flow yang membutuhkannya.
- Jangan membuat mutation penting melalui request `GET`.

### 15.7 SSRF & External URL

- Jangan melakukan fetch server-side ke URL arbitrer dari user tanpa pembatasan.
- Untuk fitur import URL/webhook callback/image proxy, gunakan allowlist host/protocol bila memungkinkan.
- Tolak protocol non-HTTP(S) yang tidak diperlukan.
- Blok akses ke localhost, metadata service, dan private network apabila endpoint memang menerima URL eksternal dari user.
- Terapkan timeout dan batas response size pada request ke third-party.

### 15.8 File Upload

- Batasi ukuran file sebelum diproses.
- Gunakan allowlist extension/MIME yang benar-benar dibutuhkan.
- Jangan percaya nama file asli sebagai path penyimpanan.
- Gunakan identifier random/UUID untuk object storage bila relevan.
- Scan file untuk malware apabila jenis aplikasi dan tingkat risiko membutuhkannya.
- Gambar/file user yang ditampilkan kembali harus menggunakan content type dan header yang aman.

### 15.9 Security Headers

- Konfigurasikan security headers melalui `next.config.ts`, proxy, atau layer deployment sesuai kebutuhan aplikasi.
- Terapkan Content Security Policy (CSP) yang membatasi sumber script, style, image, font, connect, frame, dan resource lain sesuai kebutuhan nyata.
- Hindari `unsafe-eval` pada production. Minimalkan `unsafe-inline`; gunakan nonce/hash ketika strict CSP diperlukan.
- Gunakan `frame-ancestors` pada CSP untuk mencegah clickjacking; `X-Frame-Options` dapat digunakan sebagai fallback sesuai kebutuhan kompatibilitas.
- Set `X-Content-Type-Options: nosniff`.
- Set `Referrer-Policy` yang sesuai, misalnya kebijakan yang tidak membocorkan full URL lintas origin.
- Batasi browser capability yang tidak digunakan melalui `Permissions-Policy`.
- Aktifkan HSTS hanya pada production HTTPS dan setelah memastikan seluruh domain/subdomain yang dicakup memang siap HTTPS.
- Jangan menyalin konfigurasi security header secara buta; sesuaikan dengan third-party script, analytics, map, Supabase, image host, dan kebutuhan aplikasi.

### 15.10 CORS

- Jangan menggunakan `Access-Control-Allow-Origin: *` pada endpoint private/authenticated kecuali memang aman dan disengaja.
- Gunakan allowlist origin untuk API yang perlu diakses cross-origin.
- Batasi method dan header yang diizinkan.
- Jangan mengaktifkan credentialed CORS dengan origin wildcard.

### 15.11 Rate Limiting & Abuse Prevention

- Terapkan rate limit berdasarkan kombinasi yang sesuai seperti user id, API key, IP, route, atau tenant.
- Jangan mengandalkan IP saja untuk semua kasus karena NAT/proxy dapat membuat banyak user berbagi IP.
- Endpoint mahal harus memiliki batas payload, pagination, timeout, dan rate limit.
- Gunakan backoff/retry yang terkontrol saat memanggil third-party agar tidak menimbulkan retry storm.

### 15.12 Error Handling & Information Disclosure

- Pesan error ke user harus jelas tetapi tidak membocorkan detail internal.
- Log internal boleh lebih detail, tetapi tetap harus menghapus/redact secret dan PII yang tidak diperlukan.
- Jangan mengembalikan stack trace production kepada client.
- Bedakan error validasi, unauthorized (`401`), forbidden (`403`), not found (`404`), conflict (`409`), rate limit (`429`), dan server error (`5xx`) secara tepat pada API.
- Jangan membocorkan apakah email/account tertentu terdaftar pada flow sensitif jika hal itu memudahkan user enumeration.

### 15.13 Dependency & Supply Chain

- Commit lockfile dan gunakan instalasi dependency yang deterministic pada CI.
- Review dependency baru: reputasi package, maintenance, permission/behavior, bundle impact, dan necessity.
- Update dependency secara berkala, terutama patch keamanan.
- Tinjau advisory keamanan dependency pada CI atau proses maintenance.
- Jangan menjalankan script package yang tidak dipercaya tanpa memahami dampaknya.
- Jangan menyalin kode dari internet/AI ke project tanpa review keamanan dan lisensi yang sesuai.

---

## 16. Kebutuhan Non-Fungsional

### 16.1 Performa & Kecepatan

- Skor Core Web Vitals optimal (LCP < 2.5s, CLS < 0.1).
- Menggunakan optimasi gambar Next.js (`next/image`) untuk cover buku.
- Antisipasi peningkatan jumlah pengunjung dan volume data sejak tahap perancangan.
- Ukur sebelum melakukan optimasi kompleks.
- Hindari mengirim data yang tidak digunakan ke browser.
- Gunakan pagination/infinite query untuk list besar.
- Gunakan index database untuk query yang benar-benar sering digunakan dan terukur lambat.
- Hindari N+1 query pada server dan database.
- Gunakan dynamic import/lazy loading untuk library client yang berat dan tidak langsung dibutuhkan.
- Lazy-load chart, map, editor, atau modul besar jika berada di bawah fold atau hanya muncul pada kondisi tertentu.
- Hindari hydration dan re-render berlebihan.
- Gunakan memoization hanya ketika ada kebutuhan yang terukur; jangan menambahkan `useMemo`/`useCallback` ke semua fungsi secara otomatis.
- Gunakan CDN/object storage untuk asset statis/file besar.
- Batasi ukuran upload dan download.
- Gunakan queue/background job untuk pekerjaan berat yang tidak harus selesai di request utama, apabila infrastruktur project memang mendukungnya.
- Tetapkan batas concurrency pada task yang memanggil layanan eksternal dalam jumlah besar.

### 16.2 SEO & Metadata

- OpenGraph, Twitter card tags, dan JSON-LD schema (khususnya Book Schema) di halaman detail produk.
- Sitemap otomatis dan `robots.txt`.
- Gunakan Metadata API Next.js untuk metadata statis maupun dinamis.
- Gunakan title dan meta description yang unik untuk setiap halaman.
- Sediakan Open Graph (OG) image yang sesuai.
- Sediakan sitemap yang hanya memuat URL canonical dan boleh diindeks.
- Gunakan canonical URL bila diperlukan.
- Tambahkan teks alternatif (`alt`) pada gambar.
- Gunakan internal link yang deskriptif.
- Pastikan tampilan responsif pada perangkat mobile.
- Audit Core Web Vitals.
- Integrasikan situs dengan Google Search Console.
- Periksa penggunaan `index` dan `noindex` pada setiap halaman.
- Pastikan hanya ada satu `h1` utama yang logis per halaman konten, kecuali struktur semantik memiliki alasan lain yang valid.
- Gunakan structured data/JSON-LD hanya ketika sesuai jenis konten dan datanya benar.
- Pastikan halaman private, auth, admin, preview, atau data sensitif tidak terindeks mesin pencari.
- Hindari duplicate content dari kombinasi query parameter/filter yang tidak perlu diindeks.
- Pastikan status `404`, redirect, canonical, dan metadata tidak menghasilkan soft-404 atau loop redirect.
- Hindari teks internal link generik yang berulang seperti "klik di sini".
- Pastikan konten utama dapat dirender dan dipahami tanpa bergantung pada JavaScript client yang tidak perlu.
- Optimalkan Largest Contentful Paint, Interaction to Next Paint, dan Cumulative Layout Shift.

### 16.3 Caching & Revalidation

- Tentukan secara eksplisit apakah data bersifat static, cacheable, user-specific, atau real-time.
- Jangan cache data user-specific menggunakan cache shared/global tanpa key dan scope yang benar.
- Setelah mutation, lakukan revalidation/invalidation hanya pada resource yang terdampak.
- Hindari invalidasi terlalu luas yang membuat seluruh aplikasi kehilangan manfaat cache.
- Dokumentasikan strategi cache untuk halaman/dashboard dengan traffic tinggi atau data mahal.
- Jangan mengandalkan cache sebagai authorization layer.
- Gunakan caching/revalidation untuk data yang tidak harus selalu real-time.
- Jangan cache response yang berisi data private lintas user secara global.
- Pastikan cache key mempertimbangkan user/tenant/parameter apabila cache berisi data scoped.

### 16.4 Responsivitas & Aksesibilitas

- 100% responsif di perangkat mobile, tablet, dan desktop.
- Memenuhi standar kontras warna WCAG AA dan navigasi keyboard yang baik.

### 16.5 Keamanan

- Supabase Row-Level Security (RLS) terpasang di semua tabel.
- Endpoint admin terproteksi Next.js Middleware berbasis sesi dan role.

### 16.6 State Persistence

- Status antarmuka pengguna (khususnya status buka/tutup atau *collapsed/expanded* sidebar dashboard admin) wajib disimpan di **cookies browser** (bukan *localStorage* atau state in-memory saja). Dengan disimpan di cookies, status dapat dibaca langsung oleh server (SSR) pada saat request awal, mencegah *layout shift*, menghilangkan kedipan visual (*flickering*), serta memastikan sidebar **tidak ikut me-refresh** atau kembali collapse saat halaman dimuat ulang.

### 16.7 Logging, Monitoring, & Audit

- Gunakan structured logging untuk event server penting.
- Log harus memiliki konteks yang cukup seperti request id/correlation id, route/action, status, durasi, dan actor id non-sensitif bila relevan.
- Jangan log password, access token, refresh token, cookie session mentah, service role key, API secret, atau data kartu pembayaran.
- Redact PII yang tidak diperlukan.
- Tangkap exception production menggunakan monitoring/error tracking apabila tersedia.
- Bedakan expected error (validation/not-found) dan unexpected error agar alert tidak penuh noise.
- Monitor error rate, latency, database query lambat, rate limit, auth failure abnormal, dan resource usage.
- Untuk aksi admin/kritis, pertimbangkan audit log append-only yang mencatat actor, action, target, timestamp, dan metadata aman.

---

## 17. Testing

- Terapkan **end-to-end (e2e) testing** dengan best practices untuk memastikan seluruh user flow berjalan dengan benar.
- Setiap perubahan logic penting harus memiliki pengujian yang proporsional dengan risikonya.
- Prioritaskan unit test untuk utility/business rule, integration test untuk data/auth/API, dan end-to-end test untuk user flow kritikal.
- Flow kritikal minimal mencakup login/logout, authorization admin, mutation penting, validation error, dan akses resource antar-user/tenant apabila relevan.
- Test authorization tidak hanya happy path; uji juga unauthenticated, forbidden role, ownership salah, tenant berbeda, dan input manipulatif.
- Test RLS menggunakan role/session yang menyerupai aplikasi nyata.
- Hindari test yang terlalu bergantung pada implementation detail komponen UI.
- Jangan menggunakan data production nyata pada test lokal/CI.
- Seed test data harus deterministik dan tidak mengandung credential nyata.
- Implementasikan unit testing dan/atau integration testing untuk logic kritis, dan pastikan test coverage terjaga seiring pengembangan.

---

## 18. API & Integrasi Pihak Ketiga

- Bungkus integrasi third-party pada module khusus agar mudah diganti, diuji, dan dimonitor.
- Secret third-party hanya digunakan server-side kecuali provider secara eksplisit menyediakan public client key.
- Validasi response dari third-party sebelum digunakan sebagai data tepercaya.
- Terapkan timeout dan error mapping.
- Retry hanya untuk error yang aman di-retry dan gunakan exponential backoff/jitter bila diperlukan.
- Jangan retry mutation non-idempotent secara otomatis tanpa idempotency strategy.
- Tetapkan batas payload/response dan pagination pada integrasi yang dapat menghasilkan data besar.
- Dokumentasikan quota/rate limit provider yang mempengaruhi fitur utama.

---

## 19. Struktur Folder & Modularitas

- Pertahankan struktur folder existing sebagai baseline.
- Jangan membuat folder generic seperti `utils2`, `helpers-new`, `misc`, atau `temp`.
- Kode yang hanya digunakan satu feature sebaiknya berada dekat feature tersebut.
- Kode lintas feature yang stabil dipindahkan ke folder shared seperti `components/common`, `lib`, `hooks`, `types`, atau `validations` sesuai tanggung jawab.
- Hindari circular dependency.
- Jangan mengimpor module server-only dari Client Component.
- Pisahkan constant konfigurasi dari secret environment.
- Gunakan alias import project yang konsisten sesuai `tsconfig.json`.

---

## 20. Konvensi Penamaan

- Component React: `PascalCase`.
- Hook: diawali `use`.
- Function/variable: `camelCase`.
- Constant global: gunakan gaya yang konsisten; `UPPER_SNAKE_CASE` untuk konstanta benar-benar statis bila sesuai.
- File route Next.js mengikuti konvensi framework seperti `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, dan `route.ts`.
- Nama database menggunakan pola yang konsisten, disarankan `snake_case`.
- Nama migration harus singkat namun mendeskripsikan perubahan.
- Boolean sebaiknya memiliki prefix bermakna seperti `is`, `has`, `can`, atau `should`.

---

## 21. Git & Code Review

- Jangan commit `.env.local`, credential, token, dump database sensitif, atau file generated besar yang tidak perlu.
- Commit harus fokus pada perubahan yang berkaitan.
- Jangan mencampur refactor besar dengan bugfix kecil tanpa alasan.
- PR/perubahan besar harus menjelaskan tujuan, dampak database/API, risiko, dan cara pengujian.
- Review perubahan migration, authentication, authorization, upload, dan admin action dengan perhatian ekstra.
- Jangan menonaktifkan lint/typecheck/test hanya untuk membuat CI hijau.

---

## 22. CI/CD & Deployment

- Pipeline minimum harus menjalankan install deterministic, lint, typecheck, test yang tersedia, dan build production.
- Deployment production hanya menggunakan environment variable production dari platform deployment, bukan file secret lokal.
- Pisahkan environment development, preview/staging, dan production apabila project sudah membutuhkan workflow tersebut.
- Pastikan migration dijalankan dengan urutan dan prosedur yang aman sebelum kode yang bergantung pada schema baru aktif.
- Hindari deployment yang membutuhkan perubahan schema breaking dalam satu langkah jika dapat dilakukan secara bertahap.
- Gunakan HTTPS di production.
- Pastikan source map/log/monitoring production tidak mengekspos source/secret secara publik.
- Siapkan rollback strategy untuk perubahan aplikasi dan recovery strategy untuk perubahan data yang kritis.

---

## 23. Aturan Penggunaan AI/Coding Agent

- AI harus membaca struktur dan pola kode existing sebelum membuat implementasi baru.
- AI tidak boleh menghapus requirement, validation, policy, test, atau security control existing hanya untuk menyederhanakan implementasi.
- AI harus memilih library yang sudah ada di `package.json` sebelum mengusulkan dependency baru.
- AI tidak boleh membuat API key, token, password, secret, atau credential palsu yang terlihat seperti credential nyata di source code.
- AI harus menganggap semua input client tidak tepercaya.
- AI harus mempertahankan Server Component sebagai default dan tidak menambahkan `'use client'` tanpa kebutuhan.
- AI harus menggunakan shadcn untuk komponen UI sesuai aturan project.
- AI harus menghindari `any`, `@ts-ignore`, lint disable, dan type assertion yang tidak aman sebagai jalan pintas.
- AI harus memperbarui schema validation, type, test, dan dokumentasi ketika kontrak data berubah.
- AI harus membuat migration baru untuk perubahan database dan tidak memodifikasi migration yang sudah digunakan bersama/production.
- AI harus menjelaskan trade-off apabila perubahan berdampak pada security, data migration, caching, SEO, atau backward compatibility.
- AI tidak boleh menganggap fitur selesai hanya karena UI terlihat benar; flow error, permission, loading, dan data edge case juga harus diperiksa.

---

## 24. Prioritas Pengambilan Keputusan

Jika terdapat konflik implementasi, gunakan urutan prioritas berikut:

1. Keamanan dan integritas data.
2. Kebenaran business logic.
3. Privasi dan authorization.
4. Reliability dan observability.
5. Accessibility.
6. Performance dan scalability.
7. Maintainability dan kesederhanaan kode.
8. Konsistensi UI/UX.
9. Kecepatan implementasi.

---

## 25. Checklist Sebelum Selesai

Perubahan dianggap selesai apabila poin yang relevan sudah diperiksa:

- [ ] Kebutuhan fitur terpenuhi tanpa menghapus behavior existing yang tidak termasuk scope.
- [ ] TypeScript tidak memiliki error baru.
- [ ] Lint tidak memiliki error baru.
- [ ] Build production berhasil.
- [ ] Validasi client dan server sudah sesuai kebutuhan.
- [ ] Authentication dan authorization diperiksa pada server.
- [ ] RLS/policy database ditinjau bila ada akses tabel baru atau perubahan akses.
- [ ] Tidak ada secret yang bocor ke client/log/repository.
- [ ] Loading, empty, error, dan success state tersedia bila relevan.
- [ ] Tampilan diuji pada mobile dan desktop.
- [ ] Light/dark mode diperiksa bila UI berubah.
- [ ] Keyboard/focus/label/alt/accessibility dasar diperiksa.
- [ ] SEO metadata/indexing diperiksa bila route public berubah.
- [ ] Query database memiliki pagination/index yang wajar bila berpotensi besar.
- [ ] Tidak ada duplicate fetch atau duplicate state yang tidak perlu.
- [ ] Test yang relevan ditambahkan/diperbarui dan lulus.
- [ ] Migration baru aman, berurutan, dan tidak mengedit migration production lama.
- [ ] Dependency baru benar-benar diperlukan dan telah direview.
- [ ] Dokumentasi/env.example diperbarui bila ada konfigurasi baru.

---

## 26. Scope & Batasan Versi 1.0

### Termasuk dalam v1.0

- Halaman publik lengkap (Beranda, Katalog, Detail Buku, Blog, Tentang Kami, Kontak, dan Footer Publik).
- Footer publik dengan copyright berformat `[Company Name] © [tahun]` (otomatis berubah mengikuti tahun berjalan / *current year*).
- Form kontak publik dengan penyimpanan ke tabel `contact_inquiries` (rate limit & honeypot) serta Inbox Pesan di CMS Admin.
- Pencarian global cepat berbasis Command Dialog modal (`Ctrl + K` / `cmdk`) dengan debounce 300ms.
- Dashboard CMS untuk Admin dan Super Admin dengan Rich Text Editor Tiptap (`@tiptap/react`).
- Sidebar admin responsif (slide-out dari sisi kiri pada perangkat mobile) dengan status collapse tersimpan di cookies browser (tidak kembali collapse dan tidak ikut me-refresh saat halaman di-reload).
- Autentikasi hanya untuk Admin dan Super Admin (tidak ada login/registrasi publik).
- Pembuatan akun admin baru secara langsung oleh Super Admin (email + password sementara).
- CRUD Buku, Kategori Buku (`book_categories`), Kategori Blog (`blog_categories`), Artikel Blog, Banner Promosi Berjadwal, dan Konten Halaman Publik.
- Checkout multi-kanal via **WhatsApp, Shopee, dan Tokopedia** (link eksternal saja; tombol marketplace kosong otomatis disembunyikan/hidden).
- SSR dengan persistent layout dan loading skeleton presisi.
- Supabase keep-alive cron job (`/api/keep-alive` setiap 5 hari).
- SEO, responsivitas, dark mode, aksesibilitas.
- E2E testing.
- Context7 / MCP integration.

### TIDAK termasuk dalam v1.0 (Direncanakan untuk v2.0)

- **Payment gateway** (Midtrans, Xendit, atau provider lainnya).
- **Checkout langsung** di platform (web form/gateway).
- **Pengecekan status transaksi real-time** (SSE).
- Login atau registrasi untuk pengunjung publik.
- Dependensi peta berat kustom seperti `maplibre-gl` (v1.0 memakai Google Maps Embed responsif).

---

## Prinsip Umum

- Utamakan kode yang aman, sederhana, mudah dibaca, mudah diuji, dan mudah dipelihara.
- Gunakan kemampuan bawaan Next.js, React, TypeScript, Supabase, dan library yang sudah tersedia sebelum menambah dependency baru.
- Jangan menambah dependency hanya untuk fungsi kecil yang dapat dibuat dengan aman dan ringkas menggunakan API yang sudah tersedia.
- Hindari over-engineering. Abstraksi dibuat setelah pola penggunaan benar-benar berulang atau memiliki alasan arsitektural yang jelas.
- Semua perubahan harus mempertimbangkan keamanan, aksesibilitas, performa, SEO, observability, dan maintainability sejak awal.
- Hindari perubahan besar yang tidak berkaitan dengan scope pekerjaan aktif.
- Jangan mengubah kontrak API, schema database, struktur URL publik, atau bentuk data yang sudah digunakan tanpa mempertimbangkan backward compatibility dan migration plan.
- Jangan menaruh business logic penting hanya di komponen UI.
- Jangan mempercayai data dari browser, URL, cookie, request body, header, webhook, file upload, atau third-party API tanpa validasi.
- Selalu prioritaskan keamanan dengan menerapkan prinsip _least privilege_, sanitasi _input_, dan validasi _output_ untuk mencegah celah keamanan seperti XSS, SQL injection, atau kebocoran data.
- **Gunakan NPM** sebagai package manager. Jangan gunakan pnpm atau yarn.






