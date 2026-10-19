-- Migration: 002_functions_and_rpc.sql
-- Description: Fungsi helper keamanan SECURITY DEFINER (is_active_admin, is_super_admin) dan RPC pencarian global (search_global_content).

-- 1. Helper Function: is_active_admin()
-- Memeriksa apakah pemanggil adalah user yang aktif dengan role admin atau super_admin.
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_active = true
      AND role IN ('admin'::public.user_role, 'super_admin'::public.user_role)
  );
$$;

-- 2. Helper Function: is_super_admin()
-- Memeriksa apakah pemanggil adalah user yang aktif dengan role super_admin.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_active = true
      AND role = 'super_admin'::public.user_role
  );
$$;

-- 3. Global Search RPC Function: search_global_content()
-- Digunakan untuk Command Dialog (Ctrl+K) dengan pencarian buku dan artikel blog.
-- Drop fungsi lama terlebih dahulu jika signature return type berbeda untuk menghindari error PostgreSQL 42P13
DROP FUNCTION IF EXISTS public.search_global_content(text, integer);
DROP FUNCTION IF EXISTS public.search_global_content(text);

CREATE OR REPLACE FUNCTION public.search_global_content(
  search_query text,
  result_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  slug text,
  cover_url text,
  subtitle text,
  price numeric(12, 2),
  promo_price numeric(12, 2),
  published_at timestamptz,
  similarity_score real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_trimmed text;
BEGIN
  v_is_admin := public.is_active_admin();
  v_trimmed := trim(search_query);

  IF v_trimmed = '' OR v_trimmed IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH book_matches AS (
    SELECT
      b.id,
      'book'::text AS type,
      b.title,
      b.slug,
      b.cover_url,
      b.author AS subtitle,
      b.price_regular AS price,
      b.price_promo AS promo_price,
      b.created_at AS published_at,
      GREATEST(
        similarity(b.title, v_trimmed),
        similarity(b.author, v_trimmed),
        CASE WHEN b.title ILIKE '%' || v_trimmed || '%' THEN 0.5 ELSE 0 END,
        CASE WHEN b.author ILIKE '%' || v_trimmed || '%' THEN 0.4 ELSE 0 END
      )::real AS similarity_score
    FROM public.books b
    WHERE
      (v_is_admin OR b.is_published = true)
      AND (
        b.title ILIKE '%' || v_trimmed || '%'
        OR b.author ILIKE '%' || v_trimmed || '%'
        OR similarity(b.title, v_trimmed) > 0.15
        OR similarity(b.author, v_trimmed) > 0.15
      )
  ),
  post_matches AS (
    SELECT
      p.id,
      'post'::text AS type,
      p.title,
      p.slug,
      p.cover_url,
      p.excerpt AS subtitle,
      NULL::numeric(12, 2) AS price,
      NULL::numeric(12, 2) AS promo_price,
      p.published_at,
      GREATEST(
        similarity(p.title, v_trimmed),
        similarity(p.excerpt, v_trimmed),
        CASE WHEN p.title ILIKE '%' || v_trimmed || '%' THEN 0.5 ELSE 0 END,
        CASE WHEN p.excerpt ILIKE '%' || v_trimmed || '%' THEN 0.3 ELSE 0 END
      )::real AS similarity_score
    FROM public.posts p
    WHERE
      (v_is_admin OR (p.status = 'published'::public.post_status AND p.published_at <= now()))
      AND (
        p.title ILIKE '%' || v_trimmed || '%'
        OR p.excerpt ILIKE '%' || v_trimmed || '%'
        OR similarity(p.title, v_trimmed) > 0.15
        OR similarity(p.excerpt, v_trimmed) > 0.15
      )
  )
  SELECT * FROM book_matches
  UNION ALL
  SELECT * FROM post_matches
  ORDER BY similarity_score DESC, published_at DESC
  LIMIT LEAST(result_limit, 50);
END;
$$;

-- Izin Eksekusi Fungsi
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_global_content(text, integer) TO authenticated, anon;
