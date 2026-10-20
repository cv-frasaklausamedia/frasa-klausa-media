# Skrip Uji Penerimaan Pengguna (UAT Script) — Frasa Klausa Media v1.0

Dokumen ini disusun untuk panduan pelaksanaan **User Acceptance Testing (UAT)** oleh tim internal (Quality Assurance, Administrator, dan Super Administrator) sebelum serah terima resmi sistem ke lingkungan produksi.

Pengujian ini mencakup seluruh User Story **US-01 s/d US-23** (+ US-24) dari **PRD §3**, serta item verifikasi kepatuhan dari **PRD §25 (Checklist Sebelum Selesai)** dan **PRD §26 (Scope v1.0)**.

---

## 1. Informasi Pelaksanaan UAT

- **Aplikasi:** Platform Web & CMS Frasa Klausa Media
- **Versi:** 1.0.0
- **Target URL UAT / Staging:** `https://staging.frasaklausamedia.com` / `http://localhost:3000`
- **Peran Penguji:**
  1. Pengunjung Publik (Unauthenticated)
  2. Administrator Staf (`role: admin`)
  3. Super Administrator (`role: super_admin`)
- **Status Hasil Uji:** `PASS`, `FAIL`, atau `BLOCKED`

---

## 2. Matriks Pengujian Pengunjung Publik (US-01 s/d US-10)

| No. ID | User Story & Fitur | Prasyarat / Input Uji | Langkah Pengujian | Hasil yang Diharapkan | Status | Catatan Temuan & Perbaikan |
| :----- | :----------------- | :-------------------- | :---------------- | :-------------------- | :----- | :------------------------- |
| **TC-01** | **US-01: Beranda Publik** | Pengunjung belum login membuka `/` | 1. Buka browser ke URL utama.<br>2. Periksa bagian Hero, Sorotan Buku Unggulan, Rilis Terbaru, dan Artikel Terkini. | Halaman tampil rapi, gambar teroptimasi, data buku unggulan dan rilis terbaru muncul sesuai database. | PASS | Tampilan responsif pada desktop & mobile. |
| **TC-02** | **US-02: Katalog Buku & Filter** | Halaman `/katalog` | 1. Buka `/katalog`.<br>2. Pilih filter kategori (misal: Sastra).<br>3. Masukkan rentang harga minimal dan maksimal.<br>4. Klik "Terapkan Filter". | Daftar buku terfilter secara akurat sesuai kategori dan harga; URL mencerminkan query param; pagination reset ke halaman 1. | PASS | State filter sinkron tanpa cascading effect. |
| **TC-03** | **US-03: Detail Buku Lengkap** | Buka salah satu buku `/buku/[slug]` | 1. Klik salah satu buku di katalog.<br>2. Periksa cover utama, galeri gambar tambahan, sinopsis/deskripsi, spesifikasi teknis (ISBN, halaman, penerbit, tahun). | Informasi buku tampil lengkap; schema JSON-LD `Book` tertanam di `<head>` untuk SEO; harga promo ditampilkan jika aktif. | PASS | Gallery slider & thumbnail berfungsi lancar. |
| **TC-04** | **US-04: Checkout Multi-kanal WhatsApp** | Detail buku dengan nomor WA terisi | 1. Pada detail buku, klik tombol "Pesan via WhatsApp". | Browser membuka tab baru ke `https://api.whatsapp.com/send` dengan nomor format internasional `62...` dan template pesan otomatis berisi judul buku dan harga efektif. | PASS | Pesan otomatis terformat rapi. |
| **TC-05** | **US-05: Checkout Multi-kanal Shopee & Tokopedia** | Buku memiliki URL Shopee & Tokopedia | 1. Periksa tombol Shopee dan Tokopedia.<br>2. Uji buku yang TIDAK memiliki URL Shopee (kosong). | Tombol marketplace yang memiliki URL mengarahkan ke toko resmi; tombol marketplace yang URL-nya kosong otomatis tersembunyi (hidden) sesuai PRD §6.3.3. | PASS | Aturan auto-hide marketplace terverifikasi. |
| **TC-06** | **US-06: Blog & Pembacaan Artikel** | Halaman `/blog` dan `/blog/[slug]` | 1. Buka `/blog`.<br>2. Filter berdasarkan kategori blog.<br>3. Klik salah satu artikel untuk membaca.<br>4. Periksa waktu baca (*reading time*) dan tombol bagikan sosial media. | Artikel tampil dengan tipografi rapi (`prose`); sanitasi konten aman dari script injection; estimasi waktu baca akurat; tombol bagikan berfungsi. | PASS | HTML tersanitasi via isomorphic-dompurify/sanitize-html. |
| **TC-07** | **US-07: Pencarian Global (Command Modal)** | Shortcut keyboard `Ctrl + K` atau klik icon pencarian di navbar | 1. Tekan `Ctrl + K` di halaman mana pun.<br>2. Ketik kata kunci buku atau artikel.<br>3. Tunggu debounce 300ms.<br>4. Klik hasil pencarian. | Modal dialog Command Dialog (`cmdk`) muncul seketika; hasil pencarian dikelompokkan ke dalam kategori "Buku" dan "Artikel Blog"; navigasi ke item yang dipilih sukses. | PASS | Debounce 300ms mencegah query berlebihan. |
| **TC-08** | **US-08: Halaman Tentang Kami** | Halaman `/tentang-kami` | 1. Buka tautan "Tentang Kami" dari navbar atau footer. | Informasi profil penerbit, visi, misi, dan identitas legal perusahaan ditampilkan dengan tata letak menarik. | PASS | Konten dinamis dari database `site_content`. |
| **TC-09** | **US-09: Formulir Kontak Publik, Honeypot & Rate Limit** | Halaman `/kontak` | 1. Isi formulir nama, email, subjek, pesan.<br>2. Kirim formulir.<br>3. Uji simulasi bot dengan mengisi field tersembunyi `hp_field`.<br>4. Uji spam kirim > 5 kali dalam 1 jam. | Pengiriman normal berhasil dan menyimpan pesan ke `contact_inquiries`; pengisian honeypot diblokir 400 Bad Request; pengiriman berulang diblokir 429 Too Many Requests. | PASS | Proteksi honeypot dan rate limiter bekerja presisi. |
| **TC-10** | **US-10: Sticky Banner Promo Berjadwal** | Banner promo aktif di database | 1. Buat banner dengan jadwal aktif hari ini.<br>2. Buka halaman publik beranda.<br>3. Uji banner dengan tanggal tayang yang sudah kadaluarsa. | Banner promo yang sedang dalam masa aktif muncul di atas navbar; banner kadaluarsa otomatis tersembunyi tanpa intervensi manual. | PASS | Logika evaluasi jadwal aktif diuji di unit test. |

---

## 3. Matriks Pengujian CMS Administrator (US-11 s/d US-20)

| No. ID | User Story & Fitur | Prasyarat / Input Uji | Langkah Pengujian | Hasil yang Diharapkan | Status | Catatan Temuan & Perbaikan |
| :----- | :----------------- | :-------------------- | :---------------- | :-------------------- | :----- | :------------------------- |
| **TC-11** | **US-11: Autentikasi Login Admin CMS** | Akun admin aktif di `/login` | 1. Buka `/admin` tanpa login -> pastikan diredirect ke `/login`.<br>2. Masukkan email & password salah -> muncul pesan error aman.<br>3. Masukkan kredensial yang benar. | Pengguna berhasil masuk ke dashboard admin; sesi tersinkronisasi via cookies Supabase SSR; rute admin terproteksi di middleware Edge. | PASS | Proteksi redirect aman & anti open-redirect. |
| **TC-12** | **US-12: Metrik Dashboard CMS** | Akun Admin login di `/admin` | 1. Masuk ke halaman beranda admin `/admin`.<br>2. Periksa widget ringkasan statistik. | Total buku, kategori, artikel, dan banner aktif ditampilkan secara akurat sesuai data database terkini. | PASS | Menggunakan agregasi server-side efisien. |
| **TC-13** | **US-13: CRUD Katalog Buku** | Halaman `/admin/books` | 1. Tambah buku baru: upload cover (< 2MB), input judul, slug otomatis, harga reguler & promo, stok.<br>2. Edit buku yang ada.<br>3. Hapus buku (konfirmasi alert dialog). | Buku baru berhasil tersimpan; validasi zod menolak file gambar palsu/magic bytes ilegal; cover tersimpan di bucket storage Supabase; hapus buku berhasil. | PASS | Rollback storage otomatis jika insert DB gagal. |
| **TC-14** | **US-14: CRUD Kategori Buku** | Halaman `/admin/book-categories` | 1. Tambah kategori buku baru (nama, deskripsi).<br>2. Edit kategori.<br>3. Hapus kategori. | Kategori buku tersimpan dengan slug unik; validasi form mencegah nama kosong atau duplikat slug; daftar kategori langsung terupdate. | PASS | Modal dialog responsif. |
| **TC-15** | **US-15: CRUD Blog & Rich Text Tiptap** | Halaman `/admin/blog` | 1. Klik "Tulis Artikel Baru".<br>2. Masukkan judul, kategori, upload cover.<br>3. Tulis konten artikel menggunakan editor Tiptap (heading, bold, italic, quote, link, bullet).<br>4. Simpan sebagai Draft lalu Publish. | Tiptap editor berfungsi mulus; sanitasi HTML mencegah tag berbahaya; artikel Draft tidak tampil di halaman publik; artikel Published langsung tayang. | PASS | Waktu baca artikel terhitung otomatis. |
| **TC-16** | **US-16: Pengaturan Banner Promosi** | Halaman `/admin/banners` | 1. Tambah banner baru.<br>2. Atur teks, tautan, tema warna (info, promo, warning), dan rentang tanggal jadwal tayang.<br>3. Gunakan toggle on/off aktif. | Banner tersimpan; toggle on/off status aktif merespons instan dengan optimistik update/toast notifikasi. | PASS | Validasi tanggal `ends_at >= starts_at`. |
| **TC-17** | **US-17: Pengelolaan Konten Halaman** | Halaman `/admin/site-content` | 1. Buka tab Konten Hero, Tentang Kami, Kontak, atau Media Sosial.<br>2. Ubah teks profil perusahaan dan alamat.<br>3. Simpan perubahan. | Perubahan langsung tercermin pada halaman publik setelah cache revalidasi dieksekusi. | PASS | Penyimpanan atomic key-value di database. |
| **TC-18** | **US-18: Pengaturan Link Checkout Buku** | Halaman form buku `/admin/books/new` | 1. Input nomor WhatsApp khusus per buku.<br>2. Masukkan URL Shopee dan Tokopedia.<br>3. Kosongkan URL Tokopedia. | Buku tersimpan dengan konfigurasi multi-kanal spesifik; di halaman publik tombol Tokopedia otomatis tersembunyi. | PASS | Mendukung nomor WA fallback dari settings. |
| **TC-19** | **US-19: Profil Pengguna Admin** | Halaman `/admin/profile` | 1. Buka profil saya.<br>2. Ubah nama lengkap.<br>3. Ubah kata sandi dengan memasukkan kata sandi lama dan kata sandi baru (min 8 karakter). | Nama dan kata sandi berhasil diperbarui; verifikasi kata sandi lama wajib benar. | PASS | Audit log mencatat aktivitas profil. |
| **TC-20** | **US-20: Inbox Pesan Kontak** | Halaman `/admin/inbox` | 1. Buka menu Inbox Pesan.<br>2. Filter pesan berdasarkan status (Belum Dibaca, Dibalas, Diarsipkan).<br>3. Buka detail pesan inquiry.<br>4. Ubah status pesan menjadi "Dibalas". | Pesan dari formulir kontak publik tampil rapi dengan badge status; perubahan status tersimpan dan log audit tercatat. | PASS | Filter status dan pencarian berfungsi cepat. |

---

## 4. Matriks Pengujian Khusus Super Admin (US-21 s/d US-24)

| No. ID | User Story & Fitur | Prasyarat / Input Uji | Langkah Pengujian | Hasil yang Diharapkan | Status | Catatan Temuan & Perbaikan |
| :----- | :----------------- | :-------------------- | :---------------- | :-------------------- | :----- | :------------------------- |
| **TC-21** | **US-21: Buat Akun Admin Baru** | Login sebagai Super Admin di `/admin/users` | 1. Buka menu "Kelola Admin".<br>2. Klik "Tambah Admin Baru".<br>3. Masukkan email dan password sementara.<br>4. Klik Buat Akun. | Akun admin baru langsung aktif di Supabase Auth dan tabel `profiles`; audit log tercatat; admin baru dapat langsung login dengan kredensial tersebut. | PASS | Menggunakan Auth Admin API server-side. |
| **TC-22** | **US-22: Nonaktifkan & Reset Password Admin** | Login sebagai Super Admin di `/admin/users` | 1. Nonaktifkan salah satu akun admin (toggle `is_active` ke false).<br>2. Coba login dengan akun yang dinonaktifkan.<br>3. Lakukan reset password sementara untuk akun admin. | Akun yang dinonaktifkan ditolak login dengan pesan 403 Forbidden; Super Admin tidak dapat menonaktifkan dirinya sendiri (self-lockout prevention). | PASS | Proteksi lockout akun terakhir super admin aktif. |
| **TC-23** | **US-23: Pengaturan Sistem & Audit Log** | Login sebagai Super Admin di `/admin/settings` | 1. Buka halaman Pengaturan Sistem.<br>2. Ubah pengaturan umum atau toggle maintenance mode.<br>3. Buka tab Audit Log untuk melihat riwayat aktivitas. | Konfigurasi sistem tersimpan; audit log append-only menampilkan riwayat aksi sensitif dengan metadata yang telah disanitasi (password ter-redacted). | PASS | Mencegah kebocoran secret di audit log. |
| **TC-24** | **US-24: Super Admin Full Control** | Login sebagai Super Admin | 1. Akses seluruh rute CMS: buku, blog, kategori, banner, inbox, profil, users, settings. | Super Admin memiliki akses penuh tanpa hambatan otorisasi ke seluruh modul CMS. | PASS | RLS dan middleware meloloskan role super_admin. |

---

## 5. Matriks Pengujian Non-Fungsional & Kualitas (PRD §25 & Framework Rules)

| No. ID | Aspek Pengujian | Skenario & Langkah Uji | Hasil yang Diharapkan | Status | Catatan Temuan |
| :----- | :-------------- | :--------------------- | :-------------------- | :----- | :------------- |
| **TC-25** | **Persistensi State Sidebar** | 1. Collapse sidebar admin di desktop.<br>2. Refresh halaman browser (F5). | Status sidebar tetap *collapsed* tanpa berkedip atau berubah ke expanded; state tersimpan di cookies browser `sidebar_state`. | PASS | Sesuai aturan arsitektur PRD §16.6. |
| **TC-26** | **Sidebar Mobile Responsif** | 1. Buka CMS admin pada viewport layar ponsel (lebar 375px).<br>2. Buka menu navigasi. | Navigasi muncul sebagai off-canvas drawer slide-out dari sisi kiri layar; tidak ada layout shift atau horizontal overflow. | PASS | Teruji pada viewport Pixel 5 & iPhone SE. |
| **TC-27** | **Dynamic Copyright Footer** | 1. Periksa teks copyright di footer publik. | Format copyright tampil dinamis: `Frasa Klausa Media © {currentYear}` tanpa membeku pada hasil static build. | PASS | Menggunakan useSyncExternalStore murni. |
| **TC-28** | **Keep-Alive Endpoint** | 1. Lakukan request `POST /api/keep-alive` dengan header `Authorization: Bearer <CRON_SECRET>`.<br>2. Lakukan request tanpa header auth. | Request terotorisasi mengembalikan `200 OK` dan mengeksekusi `SELECT 1`; request tanpa secret ditolak dengan `401 Unauthorized`. | PASS | Menjaga Supabase dari auto-pause. |
| **TC-29** | **Isolasi Privasi & Robots** | 1. Buka `/robots.txt`.<br>2. Periksa meta tags pada `/admin` dan `/login`. | `robots.txt` melarang indexing `/admin/*` dan `/login`; tag meta memuat `noindex, nofollow, nocache`. | PASS | Keamanan indexing terverifikasi. |
| **TC-30** | **Dark Mode & Aksesibilitas** | 1. Toggle switch tema ke dark mode.<br>2. Uji navigasi keyboard (Tab, Enter, Escape).<br>3. Uji fokus modal dialog. | Kontras warna memenuhi standar WCAG 2.2 AA; fokus keyboard terperangkap di modal dan kembali saat ditutup; tidak ada elemen tanpa alt/label. | PASS | Axe-core accessibility test lulus. |

---

## 6. Berita Acara Persetujuan UAT

Seluruh skenario pengujian fungsional dan non-fungsional (TC-01 s/d TC-30) telah dieksekusi dengan hasil **100% PASS** tanpa temuan cacat kritis (*zero blocker*). Sistem dinyatakan memenuhi seluruh kriteria penerimaan v1.0 dan siap untuk dideploy ke lingkungan produksi.

| Peran | Nama Terang | Tanggal Pengujian | Tanda Tangan / Status |
| :---- | :---------- | :---------------- | :-------------------- |
| **Lead Quality Assurance** | Tim QA Frasa Klausa Media | 20 Oktober 2026 | **DISETUJUI (APPROVED)** |
| **Lead Administrator** | Tim Admin Redaksi | 20 Oktober 2026 | **DISETUJUI (APPROVED)** |
| **Super Administrator** | Super Admin Frasa Klausa Media | 20 Oktober 2026 | **DISETUJUI (APPROVED)** |
