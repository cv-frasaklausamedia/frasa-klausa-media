# Panduan Penggunaan CMS Administrator — Frasa Klausa Media

Selamat datang di Panduan Pengguna **Content Management System (CMS) Frasa Klausa Media**. Panduan ini disusun untuk membantu staf Administrator dan Super Administrator mengelola seluruh konten website publik dengan mudah, aman, dan efisien.

---

## 1. Masuk ke Dashboard CMS (Login)

1. Buka peramban (*browser*) dan arahkan ke alamat: `https://frasaklausamedia.com/login`.
2. Masukkan alamat email dan kata sandi pengelola Anda.
3. Klik tombol **Masuk ke Dashboard**.
4. Setelah berhasil masuk, Anda akan diarahkan ke halaman utama CMS `/admin` yang menampilkan ringkasan metrik statistik (total buku, kategori, artikel, dan banner aktif).

> [!NOTE]
> CMS Frasa Klausa Media tidak menyediakan form pendaftaran publik. Seluruh akun pengelola baru dibuat secara eksklusif oleh Super Administrator.

---

## 2. Navigasi Sidebar Responsif

- **Desktop:** Anda dapat menciutkan (*collapse*) atau melebarkan (*expand*) bilah navigasi kiri (sidebar) menggunakan tombol toggle di pojok bawah/atas sidebar. Status pilihan Anda tersimpan otomatis di peramban, sehingga sidebar tidak akan berkedip atau berubah saat halaman dimuat ulang.
- **Mobile/Tablet:** Pada perangkat bergerak dengan layar sentuh, navigasi berupa laci menu (*drawer*) yang dapat dimunculkan dari sisi kiri layar dengan menekan ikon menu di bilah atas (*navbar*).

---

## 3. Mengelola Katalog Buku

Modul katalog buku dapat diakses melalui menu **Buku** (`/admin/books`).

### 3.1 Menambah Buku Baru
1. Klik tombol **Tambah Buku Baru** di pojok kanan atas.
2. **Informasi Utama:**
   - **Judul Buku:** Masukkan judul lengkap buku. Slug URL (tautan halaman) akan dibuat secara otomatis.
   - **Kategori:** Pilih kategori buku yang sesuai (misal: Puisi, Sastra, Non-Fiksi).
   - **Penulis & Penerbit:** Nama penulis dan nama penerbit (default: Frasa Klausa Media).
   - **Tahun Terbit & Jumlah Halaman:** Masukkan angka yang sesuai.
   - **ISBN:** Nomor ISBN buku (opsional, disarankan diisi).
3. **Harga & Stok:**
   - **Harga Reguler (Rp):** Wajib diisi (angka murni tanpa titik, misal `85000`).
   - **Harga Promo (Rp):** Opsional. Jika diisi dan lebih rendah dari harga reguler, sistem otomatis menampilkan label diskon di katalog publik.
   - **Jumlah Stok:** Jumlah ketersediaan buku fisik.
4. **Unggah Cover & Galeri Tambahan:**
   - **Cover Utama:** Unggah file gambar format JPG, PNG, atau WebP (maksimal 2MB).
   - **Galeri Gambar Tambahan:** Anda dapat mengunggah hingga 5 gambar interior atau alternatif sudut buku.
5. **Jalur Pemesanan Multi-Kanal (Checkout Links):**
   - **Nomor WhatsApp:** Masukkan nomor tujuan pemesanan (diawali `08...` atau `62...`).
   - **Tautan Shopee:** Masukkan URL produk resmi di Shopee. Jika buku belum tersedia di Shopee, kosongkan kolom ini (tombol Shopee otomatis tersembunyi di halaman publik).
   - **Tautan Tokopedia:** Masukkan URL produk resmi di Tokopedia. Jika kosong, tombol Tokopedia otomatis tersembunyi.
6. **Sinopsis / Deskripsi Buku:** Tuliskan sinopsis buku yang menarik bagi pembaca.
7. Klik **Simpan Buku**.

### 3.2 Mengedit & Menghapus Buku
- **Edit:** Klik ikon pensil pada baris buku yang ingin diperbarui.
- **Hapus:** Klik ikon tempat sampah. Kotak dialog konfirmasi akan muncul untuk mencegah penghapusan yang tidak disengaja.

---

## 4. Mengelola Kategori Buku & Kategori Blog

### 4.1 Kategori Buku (`/admin/book-categories`)
- Digunakan untuk mengelompokkan buku di halaman katalog publik (`/katalog`).
- Setiap kategori memiliki nama dan slug unik.
- Anda dapat menambah, mengubah nama, atau menghapus kategori yang tidak lagi digunakan.

### 4.2 Kategori Blog (`/admin/blog-categories`)
- Digunakan untuk mengelompokkan artikel literasi di halaman `/blog`.
- Dilengkapi pengaturan judul SEO dan deskripsi meta kategori untuk optimasi mesin pencari.

---

## 5. Mengelola Artikel Blog (Rich Text Editor)

Modul blog dapat diakses melalui menu **Blog** (`/admin/blog`).

### 5.1 Menulis Artikel Baru
1. Klik tombol **Tulis Artikel Baru**.
2. Masukkan **Judul Artikel** dan pilih **Kategori Blog**.
3. **Cover Artikel:** Unggah gambar sampul artikel berkualitas tinggi (rasio 16:9 disarankan).
4. **Editor Teks Kaya (Tiptap):**
   - Anda dapat menyusun artikel dengan format: Heading (H2, H3), Bold, Italic, Bullet List, Numbered List, Blockquote, dan Tautan (Link).
   - Anda dapat menyisipkan gambar langsung ke dalam tubuh artikel.
5. **Estimasi Waktu Baca:** Sistem otomatis menghitung estimasi waktu baca (misal: "3 menit baca") berdasarkan jumlah kata artikel.
6. **Status Publikasi:**
   - **Draft:** Artikel tersimpan di sistem namun belum terlihat oleh publik.
   - **Published:** Artikel langsung tayang di halaman publik `/blog`.
7. Klik **Simpan Artikel**.

---

## 6. Mengelola Banner Promosi Berjadwal

Modul banner dapat diakses melalui menu **Banner Promo** (`/admin/banners`).

Banner promosi akan tampil sebagai *sticky announcement bar* di atas bilah navigasi utama website publik.

1. Klik tombol **Tambah Banner Baru**.
2. **Pesan Promosi:** Tuliskan teks pengumuman atau promo singkat (misal: *"Diskon Peluncuran Buku Baru! Gunakan kode FRASA10 untuk potongan 10%"*).
3. **Tautan (Link):** Masukkan URL tujuan bila pengunjung mengklik banner (misal: `/katalog?kategori=diskon`).
4. **Jadwal Tayang:**
   - **Tanggal Mulai (`starts_at`):** Waktu banner mulai muncul otomatis.
   - **Tanggal Selesai (`ends_at`):** Waktu banner otomatis berhenti tayang.
5. **Toggle Status Aktif:** Anda dapat mengaktifkan atau menonaktifkan banner kapan saja secara instan tanpa perlu menghapusnya.

---

## 7. Mengelola Konten Halaman Publik

Modul konten halaman dapat diakses melalui menu **Konten Halaman** (`/admin/site-content`). Modul ini memungkinkan tim redaksi memperbarui teks website tanpa perlu bantuan tim pengembang kode.

- **Tab Hero Beranda:** Mengubah judul utama (*headline*), sub-judul (*tagline*), dan teks tombol ajakan (*Call to Action*).
- **Tab Tentang Kami:** Mengubah narasi profil penerbit, visi, misi, dan nilai-nilai perusahaan.
- **Tab Kontak & Alamat:** Memperbarui nomor telepon, WhatsApp layanan pelanggan, alamat email, alamat kantor fisik, dan tautan Google Maps Embed.
- **Tab Media Sosial:** Memperbarui tautan akun resmi Instagram, Facebook, TikTok, dan X (Twitter).

---

## 8. Mengelola Inbox Pesan Kontak

Modul pesan masuk dapat diakses melalui menu **Inbox Pesan** (`/admin/inbox`).

Setiap kali pembaca atau mitra mengirimkan pesan melalui formulir kontak publik `/kontak`, pesan tersebut otomatis masuk ke inbox CMS.

1. **Daftar Pesan:** Menampilkan nama pengirim, email, subjek, tanggal pesan, dan badge status:
   - **Belum Dibaca (Unread)** (warna kuning/oranye).
   - **Dibalas (Replied)** (warna hijau).
   - **Diarsipkan (Archived)** (warna abu-abu).
2. **Membaca & Menindaklanjuti:** Klik pesan untuk membaca isi lengkap dan nomor telepon pengirim.
3. Anda dapat langsung mengklik alamat email atau tombol WhatsApp pengirim untuk membalas pertanyaan mereka, kemudian ubah status pesan menjadi **Dibalas**.

---

## 9. Profil Pribadi & Keamanan Akun

Dapat diakses melalui menu **Profil Saya** (`/admin/profile`) atau klik avatar di pojok kanan atas bilah navigasi.

1. **Ubah Informasi Pribadi:** Perbarui nama lengkap dan avatar profil Anda.
2. **Ganti Kata Sandi:**
   - Masukkan kata sandi Anda saat ini untuk verifikasi.
   - Masukkan kata sandi baru (minimal 8 karakter dengan kombinasi huruf dan angka).
   - Konfirmasi kata sandi baru dan klik **Perbarui Kata Sandi**.

---

## 10. Pengelolaan Pengguna & Pengaturan Sistem (Khusus Super Admin)

### 10.1 Manajemen Akun Pengelola (`/admin/users`)
- **Tambah Admin Baru:** Masukkan email staf dan kata sandi sementara. Staf dapat langsung login dan mengganti kata sandi mereka di menu Profil.
- **Nonaktifkan Akun:** Jika staf sudah tidak aktif, geser toggle status ke nonaktif. Akun yang dinonaktifkan akan langsung ditolak aksesnya oleh sistem.
- **Reset Kata Sandi:** Mengatur ulang kata sandi sementara jika staf lupa kredensial.

### 10.2 Pengaturan Sistem & Audit Log (`/admin/settings`)
- **Mode Pemeliharaan (Maintenance Mode):** Tombol darurat untuk menampilkan halaman pemeliharaan kepada pengunjung publik jika sedang dilakukan perbaikan besar.
- **Audit Log:** Riwayat pencatatan otomatis (*append-only log*) yang merekam setiap aktivitas penting di CMS (pembuatan akun, perubahan status, login, dan pembaruan pengaturan) demi akuntabilitas dan keamanan sistem.
