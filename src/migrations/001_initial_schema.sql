-- Migration: 001_initial_schema.sql
-- Description: Inisialisasi skema inti database Frasa Klausa Media, tipe enum, tabel, trigger, dan indeks.

-- 1. Ekstensi PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Tipe Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'super_admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    CREATE TYPE public.post_status AS ENUM ('draft', 'published');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
    CREATE TYPE public.inquiry_status AS ENUM ('unread', 'replied', 'archived');
  END IF;
END $$;

-- 3. Fungsi Helper Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Tabel: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'admin'::public.user_role,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Tabel: book_categories
CREATE TABLE IF NOT EXISTS public.book_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Tabel: blog_categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Tabel: books
CREATE TABLE IF NOT EXISTS public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  cover_url text,
  category_id uuid NOT NULL REFERENCES public.book_categories(id) ON DELETE RESTRICT,
  author text NOT NULL,
  editor text,
  publisher text NOT NULL DEFAULT 'Frasa Klausa Media',
  publish_year integer NOT NULL CONSTRAINT check_publish_year CHECK (publish_year >= 1900 AND publish_year <= 2100),
  isbn text,
  page_count integer NOT NULL CONSTRAINT check_page_count CHECK (page_count > 0),
  price_regular numeric(12, 2) NOT NULL CONSTRAINT check_price_regular CHECK (price_regular >= 0),
  price_promo numeric(12, 2) CONSTRAINT check_price_promo CHECK (price_promo IS NULL OR price_promo < price_regular),
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  shopee_url text,
  tokopedia_url text,
  whatsapp_number text NOT NULL DEFAULT '0813-8060-4256',
  whatsapp_message_template text,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Tabel: book_images
CREATE TABLE IF NOT EXISTS public.book_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Tabel: book_related
CREATE TABLE IF NOT EXISTS public.book_related (
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  related_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, related_id),
  CONSTRAINT check_different_books CHECK (book_id <> related_id)
);

-- 10. Tabel: posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_url text,
  author_name text NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES public.blog_categories(id) ON DELETE RESTRICT,
  status public.post_status NOT NULL DEFAULT 'draft'::public.post_status,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Tabel: banners
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  link_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_banner_dates CHECK (starts_at < ends_at)
);

-- 12. Tabel: site_content
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CONSTRAINT check_site_content_key CHECK (key IN ('hero', 'about', 'contact', 'social')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Tabel: contact_inquiries
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status public.inquiry_status NOT NULL DEFAULT 'unread'::public.inquiry_status,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 14. Triggers untuk updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_book_categories_updated_at ON public.book_categories;
CREATE TRIGGER trg_book_categories_updated_at
  BEFORE UPDATE ON public.book_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER trg_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_books_updated_at ON public.books;
CREATE TRIGGER trg_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_banners_updated_at ON public.banners;
CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_site_content_updated_at ON public.site_content;
CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 15. Trigger Pembuatan Profile Baru saat User Baru Terdaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Admin Frasa Klausa'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'admin'::public.user_role),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. Trigger Pencegahan Privilege Escalation (User tidak boleh ubah role/is_active sendiri)
CREATE OR REPLACE FUNCTION public.check_profile_privilege_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role public.user_role;
  v_caller_active boolean;
  v_has_super_admin boolean;
BEGIN
  -- Jika role atau is_active diubah:
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_active IS DISTINCT FROM OLD.is_active) THEN

    -- 1. Database Admin / SQL Editor / Service Role bypass:
    -- Ketika query dijalankan via SQL Editor atau koneksi direct psql, auth.uid() bernilai NULL.
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    -- 2. Bootstrap Mode:
    -- Jika sistem belum memiliki satupun Super Admin aktif, izinkan promosi akun menjadi super_admin
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE role = 'super_admin' AND is_active = true
    ) INTO v_has_super_admin;

    IF NOT v_has_super_admin AND NEW.role = 'super_admin' THEN
      RETURN NEW;
    END IF;

    -- 3. Request melalui Web / PostgREST API (auth.uid() IS NOT NULL):
    -- Ambil role dan status aktif pemanggil dari tabel profiles
    SELECT role, is_active INTO v_caller_role, v_caller_active
    FROM public.profiles
    WHERE id = auth.uid();

    -- Pemanggil harus berstatus super_admin aktif
    IF v_caller_role IS DISTINCT FROM 'super_admin'::public.user_role OR v_caller_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Hanya Super Admin aktif yang berhak mengubah peran (role) atau status aktif pengguna.';
    END IF;

    -- User tidak boleh mengubah status role miliknya sendiri untuk mencegah penguncian sistem (lockout)
    IF auth.uid() = OLD.id AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Super Admin tidak diperbolehkan mengubah role akun miliknya sendiri untuk mencegah penguncian sistem.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_privilege_changes();

-- 17. Indeks Performa & Filter
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_is_published ON public.books(is_published);
CREATE INDEX IF NOT EXISTS idx_books_is_featured ON public.books(is_featured);
CREATE INDEX IF NOT EXISTS idx_books_price_regular ON public.books(price_regular);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_book_images_book_id ON public.book_images(book_id);
CREATE INDEX IF NOT EXISTS idx_book_images_sort_order ON public.book_images(book_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_book_related_related_id ON public.book_related(related_id);

CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON public.posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING gin (tags);

CREATE INDEX IF NOT EXISTS idx_banners_active_schedule ON public.banners(is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status_created ON public.contact_inquiries(status, created_at DESC);

-- 18. Indeks Trigram GIN untuk Pencarian Cepat
CREATE INDEX IF NOT EXISTS idx_books_trgm_search ON public.books USING gin (title gin_trgm_ops, author gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_trgm_search ON public.posts USING gin (title gin_trgm_ops, excerpt gin_trgm_ops);
