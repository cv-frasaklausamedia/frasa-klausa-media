-- Migration: 003_rls_and_storage.sql
-- Description: Kebijakan Row Level Security (RLS) di seluruh tabel public dan konfigurasi Supabase Storage.

-- ============================================================================
-- 1. AKTIFKAN RLS DI SEMUA TABEL PUBLIC
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_related ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLICIES: profiles
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO public
  USING (
    public.is_active_admin() OR id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin() OR id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_super_admin() OR id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
  );

-- ============================================================================
-- 3. POLICIES: book_categories
-- ============================================================================
DROP POLICY IF EXISTS "book_categories_select_policy" ON public.book_categories;
CREATE POLICY "book_categories_select_policy"
  ON public.book_categories
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "book_categories_insert_policy" ON public.book_categories;
CREATE POLICY "book_categories_insert_policy"
  ON public.book_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "book_categories_update_policy" ON public.book_categories;
CREATE POLICY "book_categories_update_policy"
  ON public.book_categories
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "book_categories_delete_policy" ON public.book_categories;
CREATE POLICY "book_categories_delete_policy"
  ON public.book_categories
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 4. POLICIES: blog_categories
-- ============================================================================
DROP POLICY IF EXISTS "blog_categories_select_policy" ON public.blog_categories;
CREATE POLICY "blog_categories_select_policy"
  ON public.blog_categories
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "blog_categories_insert_policy" ON public.blog_categories;
CREATE POLICY "blog_categories_insert_policy"
  ON public.blog_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "blog_categories_update_policy" ON public.blog_categories;
CREATE POLICY "blog_categories_update_policy"
  ON public.blog_categories
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "blog_categories_delete_policy" ON public.blog_categories;
CREATE POLICY "blog_categories_delete_policy"
  ON public.blog_categories
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 5. POLICIES: books
-- ============================================================================
DROP POLICY IF EXISTS "books_select_policy" ON public.books;
CREATE POLICY "books_select_policy"
  ON public.books
  FOR SELECT
  TO public
  USING (
    is_published = true OR public.is_active_admin()
  );

DROP POLICY IF EXISTS "books_insert_policy" ON public.books;
CREATE POLICY "books_insert_policy"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "books_update_policy" ON public.books;
CREATE POLICY "books_update_policy"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "books_delete_policy" ON public.books;
CREATE POLICY "books_delete_policy"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 6. POLICIES: book_images
-- ============================================================================
DROP POLICY IF EXISTS "book_images_select_policy" ON public.book_images;
CREATE POLICY "book_images_select_policy"
  ON public.book_images
  FOR SELECT
  TO public
  USING (
    public.is_active_admin() OR
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id AND b.is_published = true
    )
  );

DROP POLICY IF EXISTS "book_images_insert_policy" ON public.book_images;
CREATE POLICY "book_images_insert_policy"
  ON public.book_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "book_images_update_policy" ON public.book_images;
CREATE POLICY "book_images_update_policy"
  ON public.book_images
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "book_images_delete_policy" ON public.book_images;
CREATE POLICY "book_images_delete_policy"
  ON public.book_images
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 7. POLICIES: book_related
-- ============================================================================
DROP POLICY IF EXISTS "book_related_select_policy" ON public.book_related;
CREATE POLICY "book_related_select_policy"
  ON public.book_related
  FOR SELECT
  TO public
  USING (
    public.is_active_admin() OR
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id AND b.is_published = true
    )
  );

DROP POLICY IF EXISTS "book_related_insert_policy" ON public.book_related;
CREATE POLICY "book_related_insert_policy"
  ON public.book_related
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "book_related_delete_policy" ON public.book_related;
CREATE POLICY "book_related_delete_policy"
  ON public.book_related
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 8. POLICIES: posts
-- ============================================================================
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy"
  ON public.posts
  FOR SELECT
  TO public
  USING (
    public.is_active_admin() OR
    (status = 'published'::public.post_status AND published_at <= now())
  );

DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
CREATE POLICY "posts_insert_policy"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
CREATE POLICY "posts_update_policy"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
CREATE POLICY "posts_delete_policy"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 9. POLICIES: banners
-- ============================================================================
DROP POLICY IF EXISTS "banners_select_policy" ON public.banners;
CREATE POLICY "banners_select_policy"
  ON public.banners
  FOR SELECT
  TO public
  USING (
    public.is_active_admin() OR
    (is_active = true AND starts_at <= now() AND ends_at >= now())
  );

DROP POLICY IF EXISTS "banners_insert_policy" ON public.banners;
CREATE POLICY "banners_insert_policy"
  ON public.banners
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "banners_update_policy" ON public.banners;
CREATE POLICY "banners_update_policy"
  ON public.banners
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "banners_delete_policy" ON public.banners;
CREATE POLICY "banners_delete_policy"
  ON public.banners
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 10. POLICIES: site_content
-- ============================================================================
DROP POLICY IF EXISTS "site_content_select_policy" ON public.site_content;
CREATE POLICY "site_content_select_policy"
  ON public.site_content
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "site_content_insert_policy" ON public.site_content;
CREATE POLICY "site_content_insert_policy"
  ON public.site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "site_content_update_policy" ON public.site_content;
CREATE POLICY "site_content_update_policy"
  ON public.site_content
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "site_content_delete_policy" ON public.site_content;
CREATE POLICY "site_content_delete_policy"
  ON public.site_content
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 11. POLICIES: contact_inquiries
-- ============================================================================
DROP POLICY IF EXISTS "contact_inquiries_insert_policy" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_insert_policy"
  ON public.contact_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_inquiries_select_policy" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_select_policy"
  ON public.contact_inquiries
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

DROP POLICY IF EXISTS "contact_inquiries_update_policy" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_update_policy"
  ON public.contact_inquiries
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "contact_inquiries_delete_policy" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_delete_policy"
  ON public.contact_inquiries
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 12. STORAGE BUCKETS SETUP & STORAGE POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('books', 'books', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('blog', 'blog', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('site', 'site', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Read Policy: Public dapat membaca file di 4 bucket ini
DROP POLICY IF EXISTS "public_read_storage_objects" ON storage.objects;
CREATE POLICY "public_read_storage_objects"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id IN ('books', 'blog', 'site', 'avatars'));

-- Storage Write Policy (Admin) untuk bucket books, blog, site
DROP POLICY IF EXISTS "admin_insert_storage_objects" ON storage.objects;
CREATE POLICY "admin_insert_storage_objects"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('books', 'blog', 'site')
    AND public.is_active_admin()
  );

DROP POLICY IF EXISTS "admin_update_storage_objects" ON storage.objects;
CREATE POLICY "admin_update_storage_objects"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('books', 'blog', 'site')
    AND public.is_active_admin()
  );

DROP POLICY IF EXISTS "admin_delete_storage_objects" ON storage.objects;
CREATE POLICY "admin_delete_storage_objects"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('books', 'blog', 'site')
    AND public.is_active_admin()
  );

-- Storage Avatar Write Policy: Admin hanya bisa mengunggah ke subfolder miliknya sendiri: avatars/{uid}/*
DROP POLICY IF EXISTS "admin_insert_avatar_objects" ON storage.objects;
CREATE POLICY "admin_insert_avatar_objects"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.is_active_admin()
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "admin_update_avatar_objects" ON storage.objects;
CREATE POLICY "admin_update_avatar_objects"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_active_admin()
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "admin_delete_avatar_objects" ON storage.objects;
CREATE POLICY "admin_delete_avatar_objects"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_active_admin()
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
