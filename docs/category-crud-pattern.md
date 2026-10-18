# Pola Modul CRUD Admin — Standar Arsitektur & Replikasi

**Acuan:** PRD §6.2.D, §9.3, §10.4, §10.8, §12, §13, §14.3, §15.4  
**Implementasi Pertama:** Tahap 4 — CMS Kategori (`src/app/(admin)/admin/kategori-buku`)  
**Tujuan Dokumen:** Menjadi cetak biru (*blueprint*) dan template baku bagi seluruh modul CRUD admin lainnya pada Tahap 5 (CMS Buku), Tahap 6 (CMS Blog), Tahap 7 (Banner Promo & Konten Halaman), dan Tahap 8 (Manajemen Akun).

---

## 1. Filosofi & Pembagian Tanggung Jawab (Separation of Concerns)

Setiap modul CRUD admin wajib mengikuti 5 lapisan arsitektur yang terisolasi dengan jelas:

```
src/
├── validations/<domain>.ts        <- [Lapisan 1] Skema Zod (Form + URL Query allowlist)
├── lib/<domain>/
│   ├── types.ts                   <- [Lapisan 2] DTO domain & antarmuka tipe
│   ├── data-access.ts             <- [Lapisan 2] Server-only database queries (kolom eksplisit)
│   └── service.ts                 <- [Lapisan 2] Logika bisnis murni (authz, validasi, konflik)
├── actions/<domain>.ts            <- [Lapisan 3] Next.js Server Actions (wiring & revalidatePath)
└── app/(admin)/admin/<route>/
    ├── page.tsx                   <- [Lapisan 4] Server Component (baca URL, panggil DAL)
    ├── loading.tsx                <- [Lapisan 4] Loading skeleton presisi (tanpa layout shift)
    └── _components/               <- [Lapisan 5] Presentasi Client Component
        ├── <domain>-table.tsx         <- Integrasi TanStack Table & sinkronisasi URL state
        ├── <domain>-table-toolbar.tsx <- Pencarian debounce, page size selector, tombol tambah
        ├── <domain>-table-columns.tsx <- Definisi kolom, badge, pemformatan tanggal, dropdown aksi
        ├── <domain>-dialog.tsx        <- Modal Form (react-hook-form + zodResolver)
        └── <domain>-delete-dialog.tsx <- AlertDialog konfirmasi hapus & penjaga relasi
```

---

## 2. Lapisan 1: Validasi Zod (`src/validations/<domain>.ts`)

### Aturan Wajib:
1. **Validasi Dua Sisi:** Skema Zod dipakai bersama oleh form sisi klien (UX) dan Server Action (keamanan mutlak).
2. **Slug Generator & Regex:**
   - Gunakan format slug huruf kecil, angka, dan tanda hubung pemisah tunggal: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
   - Utility `generateSlug(text)` melakukan normalisasi NFD, pembersihan aksen/diakritik, penghapusan karakter khusus, dan pembersihan tanda hubung ganda.
3. **URL Query Allowlist & Defensive Fallbacks:**
   - Semua parameter URL (`page`, `pageSize`, `q`, `sort`) divalidasi dengan allowlist ketat.
   - Gunakan preprocessing / `.catch(default)` agar manipulasi URL ilegal tidak pernah menyebabkan error/crash 500 pada server atau klien.
   - Pilihan `pageSize` wajib dibatasi pada opsi yang diizinkan: `[10, 25, 50, 100]`.

---

## 3. Lapisan 2: Data-Access Layer (`src/lib/<domain>/data-access.ts`)

### Aturan Wajib:
1. **Wajib Server-Only:** Beri deklarasi `import 'server-only'` di baris paling atas agar modul tidak pernah bocor ke client bundle.
2. **Hindari `select('*')`:** Selalu pilih kolom secara eksplisit (PRD §9.3 & §12).
3. **Pencarian Aman:**
   - Sanitasi input pencarian `q` untuk menghindari pemecahan operator `.or()` pada sintaks PostgREST dan karakter wildcard (`%`, `_`).
4. **Perhitungan Relasi:**
   - Hitung relasi agregat (misal `books(count)`) atau gunakan query HEAD (`select('id', { count: 'exact', head: true })`) untuk pengecekan relasi tanpa memindahkan baris data berlebih.

---

## 4. Lapisan 3: Server Actions (`src/actions/<domain>.ts`)

### Aturan Wajib:
1. **Otorisasi Server:** Panggil `await requireAdmin()` (atau `await requireSuperAdmin()`) di awal setiap action. Jangan mempercayai layout atau tombol disabled di UI.
2. **Standar Response:** Gunakan helper `actionSuccess(data)` dan `actionError(message, status, code)` dari `@/lib/actions/response`.
3. **Penanganan Konflik 409:**
   - Lakukan pengecekan keunikan (misal slug duplikat) sebelum mutasi dan tangkap error Postgres `23505` secara defensif. Kembalikan kode error `SLUG_CONFLICT` dan status `409 Conflict`.
4. **Pencegahan Kebocoran Sistem:** Gunakan `sanitizeErrorMessage(err)` untuk memastikan detail internal SQL/Postgres tidak terekspos ke pengguna publik.
5. **Targeted Revalidation:** Revalidasi hanya path yang terpengaruh (misal: `revalidatePath('/admin/kategori-buku')`).

---

## 5. Lapisan 4: Halaman Server Component (`page.tsx` & `loading.tsx`)

### Aturan Wajib:
1. **Server Component Default:** `page.tsx` adalah Server Component yang membaca `searchParams: Promise<...>` secara async (Next.js 16 / async searchParams).
2. **Validasi Query:** Validasi `searchParams` menggunakan skema query Zod sebelum memanggil DAL.
3. **Error State dengan Retry:** Tangani kegagalan query dengan UI error yang rapi dan tombol "Coba Lagi" (`<Link href="...">Coba Lagi</Link>`).
4. **Presisi Skeleton (`loading.tsx`):**
   - Dimensi, proporsi, padding, dan jumlah baris skeleton wajib identik dengan komponen aslinya (10 baris tabel, toolbar, pagination) agar tidak ada *Cumulative Layout Shift* (CLS).

---

## 6. Lapisan 5: Presentasi Client & TanStack Table (`_components/`)

### Aturan Wajib:
1. **TanStack Table Server-Side:**
   - Atur konfigurasi table:
     ```ts
     manualPagination: true,
     manualSorting: true,
     rowCount: totalCount,
     pageCount: pageCount,
     ```
2. **Sinkronisasi URL Query:**
   - Perubahan pencarian, sort, page, atau page size memicu `router.push()` yang dibungkus dalam `React.useTransition()` agar transisi terasa mulus tanpa kedip layout.
   - Saat search atau sort berubah, reset `page` kembali ke 1.
3. **Form React Hook Form + ZodResolver:**
   - Gunakan `useForm` dengan mode `onTouched`.
   - Sediakan tombol switch / otomatis auto-slug dari field nama yang dapat dimatikan/diubah manual.
   - Sediakan penghitung karakter real-time untuk kolom SEO (`seo_title` max 70, `seo_description` max 160).
   - Tombol submit wajib menampilkan spinner `Loader2` dan berstatus `disabled` selama `isSubmitting`.
   - Error per-field ditampilkan di bawah input via `<FormMessage />`.
   - Toast `sonner` **hanya** dipakai untuk feedback mutasi global (sukses/gagal sistem), bukan pengganti validasi inline form.
4. **AlertDialog Hapus & Integritas Relasional:**
   - Jika entitas masih memiliki data turunan/berelasi (misal kategori masih dipakai buku), tombol hapus dicegah dan dialog menampilkan peringatan bahwa data terproteksi.
   - Jika entitas kosong (0 relasi), tampilkan konfirmasi penghapusan permanen.

---

## 7. Checklist Replikasi Cepat (Untuk Tahap 5–8)

Saat membuat modul baru (misal: CMS Buku pada Tahap 5):
- [ ] Buat skema Zod form & query di `src/validations/buku.ts`.
- [ ] Buat DTO & DAL server-only di `src/lib/books/`.
- [ ] Buat logika domain / service di `src/lib/books/service.ts`.
- [ ] Buat Server Actions di `src/actions/book.ts` dengan `requireAdmin()`.
- [ ] Buat unit test validasi & integration test action di `__tests__/`.
- [ ] Buat `_components/` (table, columns, toolbar, dialog, delete-dialog).
- [ ] Buat `loading.tsx` presisi & `page.tsx` SSR.
- [ ] Jalankan `npm test`, `npm run typecheck`, `npm run lint`, dan `npm run build`.
