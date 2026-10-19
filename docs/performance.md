# Dokumentasi Performa, Core Web Vitals & Strategi Cache

Dokumen ini mencatat baseline metrik performa, panduan optimasi aset visual, arsitektur *code-splitting*, serta matriks strategi caching dan revalidasi platform **Frasa Klausa Media**.

---

## 1. Target Core Web Vitals (CWV) & Baseline

Platform dirancang untuk melayani ribuan pengunjung pada koneksi seluler 4G/3G dengan standar tinggi Google Core Web Vitals:

| Metrik | Nama Lengkap | Ambang Batas Target | Pendekatan Rekayasa |
| :--- | :--- | :--- | :--- |
| **LCP** | *Largest Contentful Paint* | **< 2.5 detik** (Mobile) | Atribut `priority` pada cover LCP hero/detail, font `next/font/google` dengan `display: swap`, CDN Supabase Storage. |
| **CLS** | *Cumulative Layout Shift* | **< 0.1** (Nol pergeseran) | Seluruh kontainer gambar mengunci rasio aspek visual (`aspect-[3/4]`, `aspect-[16/9]`, `aspect-[16/10]`) sebelum aset selesai diunduh. Skeleton loading presisi. |
| **INP** | *Interaction to Next Paint* | **< 200 milidetik** | Debounce 300ms pada pencarian global, Server Actions non-blocking dengan optimistik state pada UI formulir. |
| **FCP** | *First Contentful Paint* | **< 1.8 detik** | Server-side rendering (SSR) dengan Next.js App Router, pemisahan CSS inline via Tailwind CSS v4. |
| **TTFB** | *Time to First Byte* | **< 800 milidetik** | Query database paralel di DAL (`Promise.all`), koneksi Supabase SSL teruji, edge runtime middleware ringan. |

---

## 2. Strategi Optimasi Gambar & Tipografi

### A. Komponen `next/image`
1. **Atribut `priority`**:
   - Hanya diberikan pada **1 elemen LCP per halaman**:
     - Beranda (`/`): Gambar utama ilustrasi / hero cover.
     - Detail Buku (`/buku/[slug]`): Sampul buku utama pada galeri foto.
     - Detail Blog (`/blog/[slug]`): Gambar cover artikel.
   - Seluruh thumbnail buku sekunder, daftar katalog, dan kartu blog di-render secara *lazy* (default bawaan Next.js).
2. **Spesifikasi Atribut `sizes`**:
   - Mencegah browser mobile mengunduh aset ukuran desktop (menghemat hingga 70% kuota seluler pengunjung):
     - `BookCard`: `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"`
     - `BlogPostCard`: `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`
     - `Navbar / Footer Logo`: `sizes="40px"` / `sizes="44px"`
3. **Pencegahan Layout Shift (Anti-CLS)**:
   - Sampul buku dipatok pada rasio `aspect-[3/4]` dengan `object-cover`.
   - Thumbnail artikel blog dipatok pada rasio `aspect-[16/9]`.
   - Peta Google Maps dipatok pada rasio `aspect-[16/10]`.

### B. Font Web (`next/font`)
- Menggunakan `Plus_Jakarta_Sans` untuk tipografi tubuh (*sans-serif*) dan `Newsreader` untuk tajuk literasi (*serif*).
- Dikonfigurasi dengan `display: 'swap'` dan subset `'latin'`, otomatis di-host secara mandiri (*self-hosted*) oleh Next.js tanpa dependensi eksternal saat runtime.

---

## 3. Pemuatan Dinamis (*Lazy-Loading*) & Dynamic Imports

Komponen berat yang hanya dibutuhkan dalam konteks tertentu diisolasi menggunakan `next/dynamic` guna meminimalkan ukuran berkas JavaScript awal (*initial JS bundle size*):

1. **Rich Text Editor (Tiptap)**:
   - Diimplementasikan melalui `src/components/admin/lazy-tiptap-editor.tsx`.
   - Menggunakan konfigurasi `dynamic(() => import('./tiptap-editor'), { ssr: false })` dengan skeleton loading interaktif.
   - Berkas besar `@tiptap/core` dan ekstensi pendukungnya **tidak pernah dikirimkan** ke pengunjung halaman publik.
2. **Grafik Metrik Dashboard Admin (Recharts)**:
   - Diisolasi dalam Client Component terpisah di dashboard admin, tidak membebani halaman publik beranda atau katalog.
3. **Google Maps Embed (Iframe Responsif)**:
   - Menggunakan iframe murni dengan atribut native browser `loading="lazy"` dan `referrerPolicy="no-referrer-when-downgrade"`.
   - Tidak memerlukan pustaka peta berat seperti `maplibre-gl` atau `leaflet`.

---

## 4. Matriks Strategi Caching & Revalidasi

Setiap rute aplikasi memiliki klasifikasi siklus hidup data yang tegas:

| Rute / Segmen | Karakteristik Data | Strategi Caching | Kebijakan Invalidasi / Revalidasi |
| :--- | :--- | :--- | :--- |
| **Beranda (`/`)** | Publik, semi-statis | Dynamic Server Rendering dengan batching DAL paralel | Tag-based revalidation saat admin memperbarui hero, tentang kami, buku unggulan, atau artikel baru. |
| **Katalog (`/katalog`)** | Publik, dinamis | Dynamic Server Rendering (berbasis `searchParams`) | Instan melalui database query; filter kombinasi non-kanonikal diberi direktif `noindex`. |
| **Detail Buku (`/buku/[slug]`)** | Publik, cacheable | Dynamic Server Rendering via DAL | Revalidasi instan per-tag saat buku disunting via CMS admin. |
| **Kategori (`/kategori/[slug]`)** | Publik, semi-statis | Dynamic Server Rendering via DAL | Revalidasi instan saat kategori diubah atau buku dalam kategori bertambah. |
| **Blog (`/blog`, `/blog/[slug]`)** | Publik, cacheable | Dynamic Server Rendering via DAL | Revalidasi saat artikel diterbitkan, diubah, atau dihapus. |
| **Admin (`/admin/*`)** | Privat, sensitif | **Strict No-Cache** (`robots: noindex, nofollow`, private cache) | Data selalu mutakhir per request; divalidasi oleh Edge Middleware dan sesi cookie admin. |
| **API Keep-Alive (`/api/keep-alive`)** | Sistem | Dynamic endpoint | Ringan (`SELECT 1`), mencegah auto-pause Supabase free tier. |
| **API Pencarian (`/api/search`)** | Publik, dinamis | Dynamic route terproteksi rate-limiting | Maksimal 30 request per menit per alamat IP; sanitasi kata kunci ketat. |

> [!CAUTION]
> **Zero Shared-Cache Leakage**:
> Seluruh operasi DAL publik menggunakan `createPublicClient()` yang bersifat *cookie-free*. Klien ini secara sengaja tidak memiliki akses ke sesi cookie pengguna sehingga aman dipanggil di lapisan *caching* tanpa risiko membocorkan data sesi admin ke pengunjung publik.

---

## 5. Ringkasan Optimasi Aksesibilitas (WCAG 2.2 AA)
- Dukungan **`prefers-reduced-motion`** di `src/app/globals.css`: Mematikan animasi dan transisi secara otomatis bagi pengguna yang sensitif terhadap gerakan.
- **Tautan Lompat Konten (*Skip Link*)**: Tautan "Lewati ke konten utama" di `src/app/(public)/layout.tsx` yang muncul saat tombol `Tab` pertama kali ditekan, langsung memindahkan fokus keyboard ke elemen `<main id="main-content">`.
- **Fokus Keyboard Terlihat**: Seluruh elemen interaktif memiliki `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden`.
- **Nama Aksesibel Lengkap**: Seluruh tombol ikon (Theme Toggle, Search, Filter) dan tautan memiliki teks visual atau atribut `aria-label`/`title` yang ramah pembaca layar (*screen reader*).
