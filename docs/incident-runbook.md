# Runbook Tanggap Insiden Produksi — Frasa Klausa Media

Dokumen ini berisi prosedur standar operasional darurat (*Incident Response Standard Operating Procedures*) untuk merespons kegagalan sistem, pemulihan layanan, dan rotasi kredensial pada platform Frasa Klausa Media.

---

## 1. Klasifikasi Tingkat Keparahan Insiden (Severity Levels)

| Level | Kriteria | Waktu Respon Target |
| :---- | :------- | :------------------ |
| **SEV-1 (Kritis)** | Website publik atau CMS admin lumpuh total (500/503), kegagalan database, atau kebocoran data sensitif. | < 15 Menit |
| **SEV-2 (Mayor)** | Fitur utama terganggu (misal: gagal checkout WhatsApp, gagal upload buku, gagal kirim form kontak). | < 1 Jam |
| **SEV-3 (Moderat)** | Masalah visual, peringatan performa, error non-blocking pada dashboard admin. | < 4 Jam |
| **SEV-4 (Minor)** | Kesalahan ketik (*typo*), penyesuaian styling minor tanpa dampak fungsional. | Sesuai jadwal sprint |

---

## 2. Insiden 1: Rollback Aplikasi Cepat (Vercel Instant Rollback)

### Skenario
Deployment versi baru di branch `main` menyebabkan error 500 fatal, layout hancur, atau kegagalan routing di production.

### Langkah Penanganan (Estimasi waktu: < 2 menit)
1. Buka dashboard Vercel: **Deployments**.
2. Identifikasi deployment stabil terakhir (deployment yang memiliki status *Ready* sebelum rilis bermasalah).
3. Klik menu tiga titik `...` pada deployment stabil tersebut.
4. Pilih **Instant Rollback**.
5. Konfirmasi popup peringatan. Traffic pengunjung langsung dialihkan ke versi stabil tanpa perlu menunggu kompilasi build baru.
6. Buat issue perbaikan di Git dan rollback commit di branch `main`.

---

## 3. Insiden 2: Kegagalan Cron Keep-Alive & Supabase Auto-Pause

### Skenario
Supabase tier free/pro mengalami auto-pause karena tidak ada aktivitas kueri selama periode tertentu, menyebabkan website tidak dapat membaca database.

### Investigasi & Deteksi
1. Periksa endpoint `/api/health`: Jika mengembalikan status `unhealthy` dengan error database.
2. Periksa log Vercel Cron: Buka Vercel Dashboard -> **Project Settings -> Cron Jobs**.
3. Periksa status eksekusi terakhir rute `/api/keep-alive`.

### Langkah Penanganan
1. **Unpause Manual via Supabase Dashboard:**
   - Masuk ke [Supabase Dashboard](https://supabase.com/dashboard).
   - Klik project Frasa Klausa Media -> jika muncul tombol **Restore Project**, klik untuk mengaktifkan kembali database.
2. **Uji Endpoint Keep-Alive Manual:**
   Kirim request POST dengan secret token untuk memastikan koneksi database aktif:
   ```bash
   curl -X POST https://frasaklausamedia.com/api/keep-alive \
     -H "Authorization: Bearer <CRON_SECRET>" \
     -H "Content-Type: application/json"
   ```
   *Ekspektasi Respon:*
   ```json
   {
     "status": "ok",
     "message": "Keep-alive ping executed successfully",
     "timestamp": "2026-10-20T07:00:00.000Z"
   }
   ```
3. Jika respon mengembalikan 401: Verifikasi apakah nilai `CRON_SECRET` di Vercel Environment Variables cocok dengan secret yang dikirimkan.

---

## 4. Insiden 3: Prosedur Rotasi Kunci Rahasia (*Secrets Rotation*)

### Skenario
Terjadi indikasi kebocoran token (misal: commit tidak sengaja, log terpapar, atau rotasi berkala triwulanan).

### 4.1 Rotasi Kunci Supabase (Anon Key & Service Role Key)
1. Buka Supabase Dashboard -> **Project Settings -> API**.
2. Di bagian **Project API keys**, klik **Generate new key** atau **Reset JWT Secret**:
   > [!WARNING]
   > Mereset JWT Secret akan membatalkan seluruh sesi pengguna yang sedang aktif dan memperbarui Anon Key serta Service Role Key secara bersamaan.
3. Salin Anon Key baru dan Service Role Key baru.
4. Buka Vercel Dashboard -> **Settings -> Environment Variables**:
   - Perbarui `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Perbarui `SUPABASE_SERVICE_ROLE_KEY`
5. Lakukan **Redeploy** pada deployment production aktif agar variabel baru dimuat ke runtime server.
6. Lakukan pengujian login admin untuk memastikan koneksi auth berhasil.

### 4.2 Rotasi `CRON_SECRET`
1. Hasilkan string acak baru (min 32 karakter hex):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Perbarui variabel `CRON_SECRET` di Vercel Environment Variables.
3. Simpan dan redeploy aplikasi.

---

## 5. Insiden 4: Penanganan Lonjakan Spam Formulir Kontak & Rate Limit

### Skenario
Bot penyerang mencoba membanjiri tabel `contact_inquiries` dengan pesan sampah atau memicu batasan API Supabase.

### Deteksi
- Lonjakan drastis pada jumlah baris di tabel `contact_inquiries` dalam hitungan menit.
- Muncul banyak respon 429 pada metrik monitoring.

### Langkah Penanganan
1. **Analisis Pola Spam di Database:**
   Jalankan query di Supabase SQL Editor:
   ```sql
   SELECT ip_address, count(*) 
   FROM contact_inquiries 
   WHERE created_at > now() - interval '1 hour'
   GROUP BY ip_address 
   ORDER BY count(*) DESC;
   ```
2. **Blokir IP Penyerang via Cloudflare / Vercel Firewall:**
   Tambahkan IP penyerang ke blokir WAF Vercel (**Settings -> Security -> Firewall**).
3. **Pembersihan Data Spam:**
   Hapus pesan yang teridentifikasi sebagai spam otomatis:
   ```sql
   DELETE FROM contact_inquiries 
   WHERE subject ILIKE '%crypto%' OR message ILIKE '%seo backlinks%';
   ```

---

## 6. Insiden 5: Pemulihan Basis Data dari Backup (*Database Disaster Recovery*)

### Skenario
Terjadi kerusakan integritas data atau kesalahan eksekusi query SQL pada database produksi.

### Langkah Pemulihan
1. **Opsi A: Point-In-Time Recovery (PITR) Supabase (Direkomendasikan)**
   - Buka Supabase Dashboard -> **Database -> Backups -> Point in Time**.
   - Pilih tanggal dan jam spesifik (sebelum kejadian insiden).
   - Klik **Restore Database**. Database akan dipulihkan ke titik waktu tersebut.
2. **Opsi B: Restore dari File Dump Lokal**
   ```bash
   pg_restore -h db.<PROJECT_REF>.supabase.co \
     -U postgres \
     -d postgres \
     -v \
     --clean \
     "backup_prod_YYYYMMDD_HHMMSS.dump"
   ```
3. Lakukan verifikasi relasional data buku, kategori, artikel blog, dan akun profil admin.
