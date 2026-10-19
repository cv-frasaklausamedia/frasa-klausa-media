# Panduan SEO & Integrasi Google Search Console (GSC)

Dokumen ini menjelaskan arsitektur SEO teknis, data terstruktur (JSON-LD), strategi pencegahan *duplicate content*, serta panduan langkah demi langkah integrasi platform **Frasa Klausa Media** dengan **Google Search Console (GSC)** dan pengujian **Rich Results**.

---

## 1. Arsitektur SEO Teknis

### A. Metadata API Next.js (App Router)
- **Root Metadata** (`src/app/layout.tsx`):
  - Mengonfigurasi `metadataBase` mengacu ke URL produksi (`NEXT_PUBLIC_APP_URL` atau `https://frasaklausamedia.com`) agar seluruh path kanonikal dan OpenGraph images ter-resolve secara absolut tanpa ambiguitas.
  - Template title terstandarisasi: `%s | Frasa Klausa Media` dengan fallback default resmi.
  - OpenGraph & Twitter card global bertipe `summary_large_image` dengan ukuran rekomendasi 1200x630px.
  - Konfigurasi `robots` global mengizinkan perayapan umum dengan direktif Googlebot optimal (`max-snippet: -1`, `max-image-preview: large`, `max-video-preview: -1`).
- **Metadata Halaman Publik Dinamis**:
  - Beranda (`/`): `canonical: '/'`, OpenGraph, Twitter card.
  - Detail Buku (`/buku/[slug]`): `canonical: '/buku/[slug]'`, meta title & description dinamis diambil dari kolom `seo_title` & `seo_description` buku (atau fallback ke judul, penulis, dan harga efektif).
  - Katalog (`/katalog`): Kanonikal selalu mengarah ke `/katalog`. Kombinasi filter (`kategori`, `minPrice`, `maxPrice`, `q`, pagination) ditandai dengan `robots: { index: false, follow: true }` guna mencegah kanibalisasi kata kunci dan pemborosan *crawl budget*.
  - Detail Artikel (`/blog/[slug]`): `canonical: '/blog/[slug]'`, OpenGraph bertipe `article` lengkap dengan waktu rilis, nama penulis, dan gambar thumbnail.
  - Kategori Buku (`/kategori/[slug]`): Kanonikal selalu mengarah ke `/kategori/[slug]`.
  - Halaman Statis (`/tentang-kami`, `/kontak`): Kanonikal unik dan deskriptif.
- **Proteksi Area Privat (Noindex)**:
  - Panel Admin (`src/app/(admin)/admin/layout.tsx`): Mengatur `robots: { index: false, follow: false, nocache: true }`.
  - Halaman Login CMS (`src/app/(auth)/login/page.tsx`): Mengatur `robots: { index: false, follow: false, nocache: true }`.
  - Rute pengalihan `/buku`: Dialihkan permanen (HTTP 308) ke `/katalog`.

---

## 2. Peta Situs XML Dinamis & Direktif Robots

### A. Dynamic XML Sitemap (`/sitemap.xml`)
Dikelola melalui `src/app/sitemap.ts` yang secara dinamis mengambil data dari database Supabase:
- **Rute Statis**: `/` (priority 1.0, daily), `/katalog` (priority 0.9, daily), `/blog` (priority 0.8, daily), `/tentang-kami` (priority 0.7, monthly), `/kontak` (priority 0.7, monthly).
- **Rute Buku**: Hanya buku yang berstatus aktif (`is_published = true`), dipetakan ke `/buku/[slug]` dengan timestamp `lastModified` dari `updated_at || created_at` (priority 0.8, weekly).
- **Rute Kategori**: Seluruh kategori buku aktif dipetakan ke `/kategori/[slug]` (priority 0.7, weekly).
- **Rute Blog**: Hanya artikel terbit (`status = 'published'` dan `published_at <= NOW()`), dipetakan ke `/blog/[slug]` (priority 0.7, weekly).
- **Keamanan Data**: Query sitemap dijalankan menggunakan anonymous public client (`createPublicClient`) tanpa membaca cookie pengguna, menjamin nol kebocoran data privat.

### B. File Direktif Mesin Pencari (`/robots.txt`)
Dikelola melalui `src/app/robots.ts`:
```text
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /login
Disallow: /api/*
Disallow: /_next/*

Sitemap: https://frasaklausamedia.com/sitemap.xml
```

---

## 3. Data Terstruktur Schema.org (JSON-LD)

Semua schema disisipkan menggunakan komponen aman `<JsonLd />` melalui fungsi sanitasi `safeJsonLd()`. Karakter HTML sensitif (`<`, `>`, `&`) otomatis dikonversi ke unicode escape string (`\u003c`, `\u003e`, `\u0026`) untuk mencegah serangan XSS melalui teks dinamis.

### A. Schema `Book` (Detail Buku `/buku/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "Book",
  "name": "Judul Buku",
  "url": "https://frasaklausamedia.com/buku/slug-buku",
  "inLanguage": "id",
  "author": {
    "@type": "Person",
    "name": "Nama Penulis"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Frasa Klausa Media"
  },
  "isbn": "978-602-xxxxx-x-x",
  "datePublished": "2026",
  "numberOfPages": 240,
  "image": "https://.../cover.jpg",
  "offers": {
    "@type": "Offer",
    "price": 85000,
    "priceCurrency": "IDR",
    "availability": "https://schema.org/InStock",
    "url": "https://frasaklausamedia.com/buku/slug-buku",
    "seller": {
      "@type": "Organization",
      "name": "Frasa Klausa Media"
    }
  }
}
```

### B. Schema `BlogPosting` (Detail Artikel `/blog/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Judul Artikel Literasi",
  "url": "https://frasaklausamedia.com/blog/slug-artikel",
  "inLanguage": "id",
  "datePublished": "2026-10-18T10:00:00Z",
  "dateModified": "2026-10-19T08:30:00Z",
  "author": [
    {
      "@type": "Person",
      "name": "Redaksi Frasa Klausa"
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "Frasa Klausa Media",
    "logo": {
      "@type": "ImageObject",
      "url": "https://frasaklausamedia.com/logo/logo.png"
    }
  }
}
```

### C. Schema `Organization` & `WebSite` (Beranda `/`)
- Memvalidasi entitas bisnis resmi: nama PT, logo resmi, nomor customer service WhatsApp (+6281380604256), alamat fisik di Jakarta Selatan, dan profil media sosial / marketplace resmi (`sameAs`).
- Memasang `potentialAction` berupa `SearchAction` yang menghubungkan pencarian Google langsung ke `/katalog?q={search_term_string}`.

---

## 4. Panduan Langkah Demi Langkah: Integrasi Google Search Console

### Langkah 1: Pendaftaran Properti di Google Search Console
1. Buka [Google Search Console](https://search.google.com/search-console).
2. Masuk menggunakan akun Google resmi penerbit (`frasaklausamedia@gmail.com`).
3. Pilih opsi properti:
   - **Domain** (Disarankan): Masukkan `frasaklausamedia.com` (mencakup semua subdomain dan protokol `https`).
   - Atau **Awalan URL**: Masukkan `https://frasaklausamedia.com`.

### Langkah 2: Verifikasi Kepemilikan
Pilih salah satu metode berikut:
1. **Verifikasi DNS TXT (Metode Terbaik)**:
   - Salin nilai TXT record yang disediakan Google (contoh: `google-site-verification=abcdef...`).
   - Masuk ke dashboard DNS domain (Cloudflare / Niagahoster / Rumahweb).
   - Tambahkan DNS Record baru:
     - Tipe: `TXT`
     - Nama: `@`
     - Nilai: `google-site-verification=...`
     - TTL: `Auto` atau `3600`.
   - Klik **Verifikasi** di GSC.
2. **Verifikasi Tag HTML (Alternatif Cepat)**:
   - Tambahkan kode verifikasi ke variable environment `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` atau tag `<meta name="google-site-verification" content="..." />` pada `src/app/layout.tsx`.

### Langkah 3: Pengiriman Peta Situs (Sitemap Submission)
1. Pada menu sebelah kiri GSC, klik **Peta Situs** (*Sitemaps*).
2. Masukkan URL: `sitemap.xml`.
3. Klik **Kirim** (*Submit*).
4. Pastikan status menunjukkan **Sukses** (*Success*). Google akan secara berkala memperbarui indeks buku dan artikel baru.

### Langkah 4: Uji Coba Rich Results (Hasil Kaya)
1. Buka [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Masukkan salah satu URL detail buku, misal: `https://frasaklausamedia.com/buku/contoh-buku`.
3. Pastikan pengujian mendeteksi:
   - Item **Buku (Book)** terdeteksi valid tanpa error kritis.
   - Atribut Penulis, Penerbit, Harga, dan Mata Uang IDR terisi akurat.
4. Uji halaman artikel blog untuk memverifikasi deteksi **Artikel (Article)**.

### Langkah 5: Inspeksi URL & Permintaan Pengindeksan Awal
1. Gunakan bilah pencarian atas GSC (*URL Inspection*).
2. Masukkan URL Beranda: `https://frasaklausamedia.com`.
3. Klik **Uji URL Langsung** (*Test Live URL*).
4. Klik **Minta Pengindeksan** (*Request Indexing*).
5. Ulangi untuk `/katalog` dan beberapa buku unggulan awal.

---

## 5. Checklist Monitoring Berkala
- [ ] Pantau menu **Cakupan Indeks** (*Page Indexing*) mingguan: pastikan tidak ada halaman publik yang berstatus *Soft 404* atau *Server Error (5xx)*.
- [ ] Pastikan halaman `/admin/*` dan `/login` terdaftar di bagian *Excluded by 'noindex' tag*, sesuai desain keamanan.
- [ ] Periksa laporan **Core Web Vitals**: pastikan metrik LCP, CLS, dan INP berada di kategori Hijau (*Good*).
