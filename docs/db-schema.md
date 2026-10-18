# Dokumentasi Skema Database & Keamanan (RLS) — Frasa Klausamedia

Dokumen ini menjelaskan struktur Entity-Relationship Diagram (ERD), aturan integritas data, kebijakan Row-Level Security (RLS), dan konfigurasi Storage untuk platform Website & CMS Frasa Klausamedia.

---

## 1. Entity-Relationship Diagram (Teks ERD)

```text
+-----------------------------------------------------------------------------------+
|                                  auth.users                                       |
|-----------------------------------------------------------------------------------|
| id: uuid (PK)                                                                     |
+-----------------------------------------------------------------------------------+
                                          | 1:1
                                          v
+-----------------------------------------------------------------------------------+
|                               public.profiles                                     |
|-----------------------------------------------------------------------------------|
| id: uuid (PK, FK -> auth.users.id ON DELETE CASCADE)                              |
| full_name: text NOT NULL                                                          |
| avatar_url: text NULL                                                             |
| role: user_role ENUM ('admin', 'super_admin') NOT NULL DEFAULT 'admin'            |
| is_active: boolean NOT NULL DEFAULT true                                          |
| created_at: timestamptz NOT NULL DEFAULT now()                                    |
| updated_at: timestamptz NOT NULL DEFAULT now()                                    |
+-----------------------------------------------------------------------------------+
       |                                                    ^
       | 1:N (opsional)                                     |
       v                                                    |
+------------------------------------------------------+    |
|                     public.posts                     |    |
|------------------------------------------------------|    |
| id: uuid (PK)                                        |    |
| title: text NOT NULL                                 |    |
| slug: text NOT NULL UNIQUE                           |    |
| excerpt: text NOT NULL DEFAULT ''                    |    |
| content: text NOT NULL DEFAULT '' (Tiptap HTML)      |    |
| cover_url: text NULL                                 |    |
| author_name: text NOT NULL                           |    |
| author_id: uuid NULL (FK -> profiles.id)             |----+
| category_id: uuid NOT NULL (FK -> blog_categories)   |----+
| status: post_status ENUM ('draft', 'published')      |    |
| published_at: timestamptz NULL                       |    |
| seo_title: text NULL, seo_description: text NULL     |    |
| tags: text[] NOT NULL DEFAULT '{}'                   |    |
| created_at: timestamptz, updated_at: timestamptz     |    |
+------------------------------------------------------+    |
                                                            |
+------------------------------------------------------+    | 1:N
|               public.blog_categories                 |    |
|------------------------------------------------------|<---+
| id: uuid (PK)                                        |
| name: text NOT NULL                                  |
| slug: text NOT NULL UNIQUE                           |
| description: text NULL                               |
| seo_title: text NULL, seo_description: text NULL     |
| created_at: timestamptz, updated_at: timestamptz     |
+------------------------------------------------------+

+------------------------------------------------------+
|               public.book_categories                 |
|------------------------------------------------------|
| id: uuid (PK)                                        |
| name: text NOT NULL                                  |
| slug: text NOT NULL UNIQUE                           |
| description: text NULL                               |
| seo_title: text NULL, seo_description: text NULL     |
| created_at: timestamptz, updated_at: timestamptz     |
+------------------------------------------------------+
       ^
       | 1:N
+-----------------------------------------------------------------------------------+
|                                public.books                                       |
|-----------------------------------------------------------------------------------|
| id: uuid (PK)                                                                     |
| title: text NOT NULL                                                              |
| slug: text NOT NULL UNIQUE                                                        |
| description: text NOT NULL DEFAULT '' (Tiptap HTML)                               |
| cover_url: text NULL                                                              |
| category_id: uuid NOT NULL (FK -> book_categories.id ON DELETE RESTRICT)          |
| author: text NOT NULL                                                             |
| editor: text NULL                                                                 |
| publisher: text NOT NULL DEFAULT 'Frasa Klausamedia'                              |
| publish_year: integer NOT NULL (CHECK: 1900 <= publish_year <= 2100)              |
| isbn: text NULL                                                                   |
| page_count: integer NOT NULL (CHECK: page_count > 0)                              |
| price_regular: numeric(12,2) NOT NULL (CHECK: price_regular >= 0)                 |
| price_promo: numeric(12,2) NULL (CHECK: price_promo < price_regular)              |
| is_featured: boolean NOT NULL DEFAULT false                                       |
| is_published: boolean NOT NULL DEFAULT false                                      |
| shopee_url: text NULL, tokopedia_url: text NULL                                   |
| whatsapp_number: text NOT NULL DEFAULT '0813-8060-4256'                           |
| whatsapp_message_template: text NULL                                              |
| seo_title: text NULL, seo_description: text NULL                                  |
| created_at: timestamptz, updated_at: timestamptz                                  |
+-----------------------------------------------------------------------------------+
       | 1:N                                          | M:N
       v                                              v
+-------------------------------+       +---------------------------------------------+
|      public.book_images       |       |            public.book_related              |
|-------------------------------|       |---------------------------------------------|
| id: uuid (PK)                 |       | book_id: uuid (PK, FK -> books.id CASCADE)  |
| book_id: uuid (FK -> books.id)|       | related_id: uuid (PK, FK -> books.id CASCADE|
| image_url: text NOT NULL      |       | CONSTRAINT: book_id <> related_id           |
| sort_order: integer DEFAULT 0 |       | created_at: timestamptz DEFAULT now()       |
| created_at: timestamptz       |       +---------------------------------------------+
+-------------------------------+

+-----------------------------------------------------------------------------------+
|                                 public.banners                                    |
|-----------------------------------------------------------------------------------|
| id: uuid (PK)                                                                     |
| message: text NOT NULL                                                            |
| link_url: text NULL                                                               |
| starts_at: timestamptz NOT NULL, ends_at: timestamptz NOT NULL                    |
| is_active: boolean NOT NULL DEFAULT true                                          |
| CONSTRAINT: starts_at < ends_at                                                   |
| created_at: timestamptz, updated_at: timestamptz                                  |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
|                              public.site_content                                  |
|-----------------------------------------------------------------------------------|
| id: uuid (PK)                                                                     |
| key: text NOT NULL UNIQUE ('hero', 'about', 'contact', 'social')                  |
| payload: jsonb NOT NULL DEFAULT '{}'::jsonb                                       |
| created_at: timestamptz, updated_at: timestamptz                                  |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
|                            public.contact_inquiries                               |
|-----------------------------------------------------------------------------------|
| id: uuid (PK)                                                                     |
| name: text NOT NULL, email: text NOT NULL, phone: text NULL                        |
| subject: text NOT NULL, message: text NOT NULL                                    |
| status: inquiry_status ENUM ('unread', 'replied', 'archived') DEFAULT 'unread'    |
| created_at: timestamptz NOT NULL DEFAULT now()                                    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Matriks Kebijakan Row Level Security (RLS)

Seluruh tabel publik memiliki RLS aktif (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

| Nama Tabel | Peran Anonim (`anon` / Publik) | Peran Admin Aktif (`is_active_admin()`) | Super Admin (`is_super_admin()`) |
| :--- | :--- | :--- | :--- |
| **`profiles`** | **Deny All** | SELECT semua profil tim; UPDATE nama & avatar profil dirinya | Full CRUD profil admin lain |
| **`book_categories`** | SELECT semua kategori | INSERT, UPDATE, DELETE | Full CRUD |
| **`blog_categories`** | SELECT semua kategori | INSERT, UPDATE, DELETE | Full CRUD |
| **`books`** | SELECT HANYA `is_published = true` | SELECT semua (termasuk draf), INSERT, UPDATE, DELETE | Full CRUD |
| **`book_images`** | SELECT jika bukunya `is_published = true` | INSERT, UPDATE, DELETE | Full CRUD |
| **`book_related`** | SELECT jika bukunya `is_published = true` | INSERT, UPDATE, DELETE | Full CRUD |
| **`posts`** | SELECT HANYA `status = 'published'` dan `published_at <= now()` | SELECT semua (termasuk draf/jadwal), INSERT, UPDATE, DELETE | Full CRUD |
| **`banners`** | SELECT HANYA `is_active = true` dan berada dalam jadwal | SELECT semua banner, INSERT, UPDATE, DELETE | Full CRUD |
| **`site_content`** | SELECT semua section | INSERT, UPDATE, DELETE | Full CRUD |
| **`contact_inquiries`**| INSERT saja (mengirim form pesan kontak) | SELECT semua pesan, UPDATE (`status`), DELETE | Full CRUD |

### Proteksi Keamanan Khusus
1. **Trigger `check_profile_privilege_changes`**:
   Mencegah eskalasi hak istimewa (*privilege escalation*). Admin tidak diizinkan mengubah kolom `role` atau `is_active` miliknya sendiri.
2. **Helper `SECURITY DEFINER`**:
   `public.is_active_admin()` dan `public.is_super_admin()` dieksekusi dengan path schema yang aman (`search_path = public`) untuk mencegah search_path hijacking.

---

## 3. Storage Buckets & Policies

| Bucket | Akses Publik | Ukuran Maksimal | MIME Types yang Diizinkan | Kebijakan Tulis / Hapus |
| :--- | :--- | :--- | :--- | :--- |
| `books` | Ya (Read Public) | 5 MB | `image/jpeg`, `image/png`, `image/webp` | `public.is_active_admin()` |
| `blog` | Ya (Read Public) | 5 MB | `image/jpeg`, `image/png`, `image/webp` | `public.is_active_admin()` |
| `site` | Ya (Read Public) | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` | `public.is_active_admin()` |
| `avatars` | Ya (Read Public) | 2 MB | `image/jpeg`, `image/png`, `image/webp` | `public.is_active_admin()` dan nama folder wajib sama dengan `auth.uid()` |

---

## 4. Fungsi Pencarian Global (`search_global_content`)

Fungsi RPC PostgreSQL berkinerja tinggi untuk mendukung fitur Command Dialog (`Ctrl + K`):
```sql
SELECT * FROM public.search_global_content('novel', 10);
```
- Memanfaatkan ekstensi `pg_trgm` dan operator GIN similarity untuk pencarian cepat judul buku, nama penulis, dan artikel blog.
- Otomatis menyaring hanya konten yang telah terbit jika dipanggil oleh pengunjung umum (anonim).
