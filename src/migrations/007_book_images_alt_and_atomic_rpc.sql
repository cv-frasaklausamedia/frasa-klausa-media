-- ============================================================================
-- Migrasi 007: Penambahan Kolom alt_text pada book_images dan Fungsi RPC Atomik Buku
-- File: src/migrations/007_book_images_alt_and_atomic_rpc.sql
-- 
-- CATATAN EKSEKUSI PENTING:
-- File migrasi ini WAJIB dijalankan secara manual oleh pengembang/admin pada
-- Supabase Dashboard -> SQL Editor sebelum melakukan pengujian manual fitur Buku.
-- ============================================================================

-- 1. Penambahan kolom alt_text pada book_images (Aksesibilitas & SEO per PRD §6.2.E & §14.5)
ALTER TABLE public.book_images
ADD COLUMN IF NOT EXISTS alt_text text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.book_images.alt_text IS 'Deskripsi teks alternatif gambar untuk aksesibilitas (a11y) dan pengindeksan mesin pencari.';

-- 2. Tipe Pengembalian RPC Buku
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'book_mutation_result') THEN
    CREATE TYPE public.book_mutation_result AS (
      book_id uuid,
      unused_image_urls text[]
    );
  END IF;
END $$;

-- 3. Fungsi Atomik: upsert_book_atomic
-- Menangani pembuatan (insert) dan pembaruan (update) buku, sinkronisasi book_images,
-- dan sinkronisasi book_related dalam SATU transaksi atomik.
-- Mengembalikan ID buku dan daftar URL gambar yang sudah tidak digunakan lagi
-- (selisih DISTINCT gambar lama dikurangi gambar baru) sehingga aplikasi dapat
-- menghapus berkas yatim di Storage SETELAH transaksi commit.
CREATE OR REPLACE FUNCTION public.upsert_book_atomic(
  p_book_id uuid, -- NULL jika insert (buku baru), UUID jika update
  p_title text,
  p_slug text,
  p_description text,
  p_cover_url text,
  p_category_id uuid,
  p_author text,
  p_editor text,
  p_publisher text,
  p_publish_year integer,
  p_isbn text,
  p_page_count integer,
  p_price_regular numeric,
  p_price_promo numeric,
  p_is_featured boolean,
  p_is_published boolean,
  p_shopee_url text,
  p_tokopedia_url text,
  p_whatsapp_number text,
  p_whatsapp_message_template text,
  p_seo_title text,
  p_seo_description text,
  p_gallery_images jsonb DEFAULT '[]'::jsonb, -- Array of objects: [{"image_url": "...", "alt_text": "...", "sort_order": 0}]
  p_related_book_ids uuid[] DEFAULT ARRAY[]::uuid[] -- Array of book IDs (maksimal 5)
)
RETURNS public.book_mutation_result
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_book_id uuid := p_book_id;
  v_unused_images text[] := ARRAY[]::text[];
  v_deduped_related_ids uuid[] := ARRAY[]::uuid[];
  v_valid_related_count integer := 0;
  v_related_id uuid;
  v_img record;
  v_new_index integer := 0;
  v_result public.book_mutation_result;
BEGIN
  -- A. Pemeriksaan Otorisasi (Hanya Admin Aktif yang berhak mengeksekusi)
  IF NOT public.is_active_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin aktif yang diizinkan mengelola katalog buku.'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- B. Deduplikasi dan Validasi Relasi Buku
  -- 1. Dedupe p_related_book_ids di awal
  SELECT COALESCE(ARRAY(
    SELECT DISTINCT u
    FROM unnest(COALESCE(p_related_book_ids, ARRAY[]::uuid[])) AS u
    WHERE u IS NOT NULL
  ), ARRAY[]::uuid[]) INTO v_deduped_related_ids;

  -- 2. Validasi maksimal 5 buku terkait (setelah dedupe, COALESCE memastikan tidak NULL)
  IF COALESCE(array_length(v_deduped_related_ids, 1), 0) > 5 THEN
    RAISE EXCEPTION 'Maksimal 5 buku terkait yang dapat dipilih.'
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 3. Buku tidak boleh terkait dengan dirinya sendiri
  IF v_book_id IS NOT NULL AND v_book_id = ANY(v_deduped_related_ids) THEN
    RAISE EXCEPTION 'Buku tidak dapat ditautkan dengan dirinya sendiri.'
      USING ERRCODE = '22023';
  END IF;

  -- 4. Pastikan seluruh related_id yang dikirim valid dan ada di database
  IF COALESCE(array_length(v_deduped_related_ids, 1), 0) > 0 THEN
    SELECT count(id) INTO v_valid_related_count
    FROM public.books
    WHERE id = ANY(v_deduped_related_ids);

    IF v_valid_related_count <> COALESCE(array_length(v_deduped_related_ids, 1), 0) THEN
      RAISE EXCEPTION 'Satu atau lebih buku terkait yang dipilih tidak ditemukan di database.'
        USING ERRCODE = '23503'; -- foreign_key_violation
    END IF;
  END IF;

  -- B.1. Validasi tipe p_gallery_images jika diberikan
  IF p_gallery_images IS NOT NULL AND jsonb_typeof(p_gallery_images) <> 'array' THEN
    RAISE EXCEPTION 'Parameter p_gallery_images harus berupa array JSON.'
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- C. Jika UPDATE: Kunci baris dengan SELECT ... FOR UPDATE dan hitung selisih gambar
  IF v_book_id IS NOT NULL THEN
    PERFORM 1
    FROM public.books
    WHERE id = v_book_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Buku dengan ID % tidak ditemukan.', v_book_id
        USING ERRCODE = 'P0002'; -- no_data_found
    END IF;

    -- Hitung unused_image_urls sebagai:
    -- (cover lama + galeri lama) EXCEPT (cover baru + galeri baru), DISTINCT, abaikan NULL dan string kosong.
    -- Dengan begitu gambar yang dipindahkan antara cover dan galeri TIDAK ikut terhapus!
    WITH old_images AS (
      SELECT b.cover_url AS img_url
      FROM public.books b
      WHERE b.id = v_book_id AND b.cover_url IS NOT NULL AND b.cover_url <> ''
      UNION
      SELECT bi.image_url AS img_url
      FROM public.book_images bi
      WHERE bi.book_id = v_book_id AND bi.image_url IS NOT NULL AND bi.image_url <> ''
    ),
    new_images AS (
      SELECT p_cover_url AS img_url
      WHERE p_cover_url IS NOT NULL AND p_cover_url <> ''
      UNION
      SELECT (elem->>'image_url')::text AS img_url
      FROM jsonb_array_elements(COALESCE(p_gallery_images, '[]'::jsonb)) AS elem
      WHERE elem->>'image_url' IS NOT NULL AND elem->>'image_url' <> ''
    )
    SELECT COALESCE(array_agg(img_url), ARRAY[]::text[])
    INTO v_unused_images
    FROM (
      SELECT DISTINCT img_url FROM old_images
      EXCEPT
      SELECT DISTINCT img_url FROM new_images
    ) AS diff_images;
  END IF;

  -- D. Eksekusi INSERT atau UPDATE pada tabel public.books
  IF v_book_id IS NULL THEN
    INSERT INTO public.books (
      title,
      slug,
      description,
      cover_url,
      category_id,
      author,
      editor,
      publisher,
      publish_year,
      isbn,
      page_count,
      price_regular,
      price_promo,
      is_featured,
      is_published,
      shopee_url,
      tokopedia_url,
      whatsapp_number,
      whatsapp_message_template,
      seo_title,
      seo_description
    ) VALUES (
      p_title,
      p_slug,
      COALESCE(p_description, ''),
      p_cover_url,
      p_category_id,
      p_author,
      p_editor,
      COALESCE(p_publisher, 'Frasa Klausa Media'),
      p_publish_year,
      p_isbn,
      p_page_count,
      p_price_regular,
      p_price_promo,
      COALESCE(p_is_featured, false),
      COALESCE(p_is_published, false),
      p_shopee_url,
      p_tokopedia_url,
      COALESCE(p_whatsapp_number, '6281380604256'),
      p_whatsapp_message_template,
      p_seo_title,
      p_seo_description
    )
    RETURNING id INTO v_book_id;
  ELSE
    UPDATE public.books SET
      title = p_title,
      slug = p_slug,
      description = COALESCE(p_description, ''),
      cover_url = p_cover_url,
      category_id = p_category_id,
      author = p_author,
      editor = p_editor,
      publisher = COALESCE(p_publisher, 'Frasa Klausa Media'),
      publish_year = p_publish_year,
      isbn = p_isbn,
      page_count = p_page_count,
      price_regular = p_price_regular,
      price_promo = p_price_promo,
      is_featured = COALESCE(p_is_featured, false),
      is_published = COALESCE(p_is_published, false),
      shopee_url = p_shopee_url,
      tokopedia_url = p_tokopedia_url,
      whatsapp_number = COALESCE(p_whatsapp_number, '6281380604256'),
      whatsapp_message_template = p_whatsapp_message_template,
      seo_title = p_seo_title,
      seo_description = p_seo_description,
      updated_at = now()
    WHERE id = v_book_id;
  END IF;

  -- E. Sinkronisasi public.book_images
  -- Hapus entri lama lalu masukkan kembali dengan sort_order deterministik
  -- menggunakan WITH ORDINALITY sebagai tie-breaker sehingga hasil akhir selalu 0..n-1
  DELETE FROM public.book_images WHERE book_id = v_book_id;

  IF p_gallery_images IS NOT NULL AND jsonb_array_length(p_gallery_images) > 0 THEN
    v_new_index := 0;
    FOR v_img IN
      SELECT
        (elem->>'image_url')::text AS image_url,
        COALESCE(elem->>'alt_text', '')::text AS alt_text,
        COALESCE((elem->>'sort_order')::integer, (ord::integer - 1)) AS explicit_order,
        (ord::integer - 1) AS tie_breaker_order
      FROM jsonb_array_elements(p_gallery_images) WITH ORDINALITY AS t(elem, ord)
      WHERE elem->>'image_url' IS NOT NULL AND elem->>'image_url' <> ''
      ORDER BY explicit_order ASC, tie_breaker_order ASC
    LOOP
      INSERT INTO public.book_images (
        book_id,
        image_url,
        alt_text,
        sort_order
      ) VALUES (
        v_book_id,
        v_img.image_url,
        v_img.alt_text,
        v_new_index
      );
      v_new_index := v_new_index + 1;
    END LOOP;
  END IF;

  -- F. Sinkronisasi public.book_related (Hapus relasi lama lalu masukkan relasi baru yang ter-dedupe)
  DELETE FROM public.book_related WHERE book_id = v_book_id;

  IF COALESCE(array_length(v_deduped_related_ids, 1), 0) > 0 THEN
    FOREACH v_related_id IN ARRAY v_deduped_related_ids
    LOOP
      IF v_related_id <> v_book_id THEN
        INSERT INTO public.book_related (book_id, related_id)
        VALUES (v_book_id, v_related_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- G. Kembalikan hasil mutasi
  v_result.book_id := v_book_id;
  v_result.unused_image_urls := v_unused_images;
  RETURN v_result;
END;
$$;

-- 4. Hak Akses (Privileges) RPC dengan Signature Lengkap
REVOKE ALL ON FUNCTION public.upsert_book_atomic(
  uuid, text, text, text, text, uuid, text, text, text, integer, text, integer,
  numeric, numeric, boolean, boolean, text, text, text, text, text, text, jsonb, uuid[]
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.upsert_book_atomic(
  uuid, text, text, text, text, uuid, text, text, text, integer, text, integer,
  numeric, numeric, boolean, boolean, text, text, text, text, text, text, jsonb, uuid[]
) TO authenticated;

COMMENT ON FUNCTION public.upsert_book_atomic IS 'Menyimpan atau memperbarui buku beserta galeri dan relasi dalam satu transaksi atomik. Hanya dapat dipanggil oleh admin terautentikasi.';
