# Dokumentasi Modul: CMS Kategori Buku (Tahap 4)

**Acuan PRD:** §6.2.D, §9.3, §10.4, §10.8, §12, §13, §14.3, §15.4  
**Status:** Selesai (DoD Terpenuhi 100%)  
**Tujuan Dokumen:** Panduan teknis dan cetak biru (*blueprint reference*) bagi implementasi modul CRUD berikutnya (Tahap 5: CMS Buku, Tahap 6: CMS Blog, Tahap 7: Banner Promo & Konten Halaman).

---

## 1. Ikhtisar Arsitektur 5-Lapisan

Modul Kategori Buku mengimplementasikan *Separation of Concerns* (SoC) secara ketat melalui 5 lapisan:

```
src/
├── validations/category.ts                   <- [Lapisan 1] Skema Zod (Form, auto-slug, URL Query allowlist)
├── lib/categories/
│   ├── types.ts                              <- [Lapisan 2] DTO domain & antarmuka response
│   └── data-access.ts                        <- [Lapisan 2] Server-only Supabase queries (kolom eksplisit)
├── actions/category.ts                       <- [Lapisan 3] Next.js Server Actions (RBAC requireAdmin, 409 conflict, guard relasi)
├── app/(admin)/admin/book-categories/
│   ├── page.tsx                              <- [Lapisan 4] Server Component (async searchParams, error boundary retry)
│   ├── loading.tsx                           <- [Lapisan 4] Precision skeleton 10-row anti-CLS
│   └── _components/                          <- [Lapisan 5] Presentasi Client Component
│       ├── category-table.tsx                <- TanStack Table v8 server-side & sinkronisasi URL (useTransition)
│       ├── category-table-toolbar.tsx        <- Search 300ms debounce, page size (10/25/50/100), tambah baru
│       ├── category-table-columns.tsx        <- Definisi kolom, sort indicator visual, badge count buku, tanggal
│       ├── category-dialog.tsx               <- Form modal (react-hook-form + zodResolver + auto-slug + live counters)
│       └── category-delete-dialog.tsx        <- AlertDialog penjaga integritas relasi buku (ON DELETE RESTRICT)
└── app/(admin)/admin/kategori-buku/
    └── page.tsx                              <- Redirect rute kompatibilitas ke /admin/book-categories
```

---

## 2. Rincian Teknis per Lapisan

### Lapisan 1: Validasi Zod (`src/validations/category.ts`)
- **Utilitas Slug:** `generateSlug(text)` melakukan normalisasi unicode NFD, menghapus diakritik/aksen, mengubah ke huruf kecil, menghapus karakter berbahaya, dan memangkas tanda hubung ganda.
- **Regex Slug:** `SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- **Form Schema:** Memvalidasi nama (2–100 kar), slug (2–100 kar regex), deskripsi (max 500 kar opsional), meta title (max 70 kar), meta description (max 160 kar). String kosong otomatis di-transform menjadi `null`.
- **Query Schema (Defensive):** Menggunakan `.catch()` untuk setiap query param (`page`, `pageSize`, `q`, `sort`). Nilai di luar batas atau karakter berbahaya otomatis di-reset ke nilai default yang aman (`page: 1`, `pageSize: 10`, `sort: 'created_at_desc'`).

### Lapisan 2: Data-Access Layer (`src/lib/categories/data-access.ts`)
- **Server-Only:** Menggunakan `import 'server-only'` agar kode query DB tidak pernah bocor ke client bundle.
- **Eksplisit Kolom:** Tidak pernah menggunakan `select('*')`. Selalu memilih kolom:
  `id, name, slug, description, seo_title, seo_description, created_at, updated_at, books(count)`.
- **Sanitasi Pencarian:** Membersihkan karakter wildcard SQL (`%`, `_`) dan sintaks pemecah klausa PostgREST.
- **Kalkulasi Relasi:** Menghitung jumlah relasi buku melalui agregat `books(count)` dan query HEAD untuk proteksi penghapusan.

### Lapisan 3: Server Actions (`src/actions/category.ts`)
- **Otorisasi Server:** Wajib mengeksekusi `await requireAdmin()` di baris pertama setiap action (create, update, delete).
- **Penanganan Konflik 409:** Memeriksa apakah slug sudah terdaftar sebelum mutasi. Mengembalikan status HTTP 409 `CONFLICT` dengan kode error `CONFLICT` jika terdeteksi duplikat.
- **Proteksi Integritas Relasi Hapus:** Memeriksa `getCategoryBookCount(id)`. Jika `> 0`, mutasi ditolak dengan status 400 `BAD_REQUEST`: *"Kategori tidak dapat dihapus karena masih digunakan oleh {count} buku. Harap pindahkan atau hapus buku terkait terlebih dahulu."*
- **Targeted Revalidation:** Merevalidasi hanya path yang terpengaruh (`/admin/book-categories` dan `/admin`).
- **Error Shielding:** Membungkus eksekusi dengan `handleActionError(error)` untuk mencegah kebocoran kredensial DB, SQL query mentah, atau nama tabel.

### Lapisan 4: Server Component & Skeleton (`page.tsx` & `loading.tsx`)
- Menggunakan async `props.searchParams` sesuai spesifikasi Next.js 16.
- Memanggil `await connection()` dari `next/server` pada inner component yang dibungkus `<Suspense>` untuk opt-in ke dynamic request-time rendering (mencegah error Next.js 16 Partial Prerendering / Cache Components).
- Menjalankan `categoryQuerySchema.parse(rawParams)`.
- Memisahkan eksekusi pengambilan data dan konstruksi JSX di luar try/catch guna mematuhi aturan React 19 compiler `react-hooks/error-boundaries`.
- `loading.tsx` menyajikan skeleton 10 baris tabel, toolbar, dan footer dengan proporsi lebar identik untuk mencegah *Cumulative Layout Shift* (CLS).

### Lapisan 5: Presentasi Client (TanStack Table + RHF)
- **TanStack Table Server-Side:** Menggunakan `manualPagination: true`, `manualSorting: true`, `rowCount: totalCount`, dan `pageCount`.
- **Sinkronisasi URL:** Perubahan pencarian, sort, page, atau page size memicu `router.push()` yang dibungkus dalam `React.useTransition()`.
- **Form Auto-Slug & Integritas `<FormLabel>`:** Komponen `<FormLabel>` shadcn/ui wajib selalu ditempatkan di dalam `<FormItem>` di dalam `<FormField>` agar konteks form (`useFormField`) tersedia dengan benar. Dilengkapi switch auto-slug dinamis dari field nama.
- **Live Character Counters:** Menampilkan penghitung karakter real-time untuk `seo_title` (`x / 70`) dan `seo_description` (`x / 160`).
- **AlertDialog Proteksi Relasi:** Jika kategori memiliki buku (`book_count > 0`), modal menampilkan peringatan amber bahwa data terkunci dan tombol hapus dinonaktifkan.

---

## 3. Checklist Replikasi Modul CRUD (Tahap 5–7)

Gunakan pola ini saat membangun modul baru (misal: CMS Buku pada Tahap 5):

1. **Skema Zod (`src/validations/<domain>.ts`):**
   - Skema form input dengan batasan panjang ketat.
   - Skema URL query params dengan allowlist dan defensive `.catch()`.
2. **DTO & DAL (`src/lib/<domain>/`):**
   - `types.ts`: Antarmuka data item dan list response.
   - `data-access.ts`: `import 'server-only'`, kolom eksplisit, sanitasi query `q`.
3. **Server Actions (`src/actions/<domain>.ts`):**
   - Panggil `await requireAdmin()`.
   - Validasi payload via skema Zod.
   - Cek keunikan slug / konflik kunci unik (409).
   - Revalidasi path terarah (`revalidatePath`).
   - Tangani error via `handleActionError`.
4. **Halaman Server & Skeleton (`src/app/(admin)/admin/<domain>/`):**
   - `page.tsx`: async `searchParams`, fetch via DAL, error state dengan retry button.
   - `loading.tsx`: 10-row skeleton anti-CLS.
5. **Komponen Client (`_components/`):**
   - `<domain>-table.tsx`: TanStack Table v8 server-side, URL sync via `useTransition`.
   - `<domain>-table-toolbar.tsx`: Debounce search, page size selector, tambah baru.
   - `<domain>-table-columns.tsx`: Definisi kolom, sort indicator visual, dropdown aksi.
   - `<domain>-dialog.tsx`: RHF + ZodResolver, auto-slug, submit loading state.
   - `<domain>-delete-dialog.tsx`: AlertDialog dengan pengecekan relasi turunan.
6. **Pengujian (`tests/<domain>-*.test.ts`):**
   - Unit test validator & utilitas.
   - Integration test Server Actions (RBAC 401/403, 409 conflict, guard 400).
