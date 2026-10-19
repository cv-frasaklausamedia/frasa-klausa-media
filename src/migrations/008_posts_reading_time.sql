-- ============================================================================
-- Migrasi 008: Penambahan Kolom reading_time_minutes dan Indeks Publik pada posts
-- File: src/migrations/008_posts_reading_time.sql
-- 
-- CATATAN EKSEKUSI PENTING:
-- File migrasi ini WAJIB dijalankan oleh pengembang/admin pada
-- Supabase Dashboard -> SQL Editor sebelum melakukan pengujian fitur Blog.
-- ============================================================================

-- 1. Penambahan kolom reading_time_minutes pada tabel posts (PRD §6.2.F & Tahap 6)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS reading_time_minutes integer NOT NULL DEFAULT 1
CONSTRAINT check_reading_time_positive CHECK (reading_time_minutes >= 1);

COMMENT ON COLUMN public.posts.reading_time_minutes IS 'Estimasi waktu membaca artikel dalam hitungan menit (dihitung ±200 kata/menit).';

-- 2. Indeks gabungan untuk mempercepat query publik (status published dan published_at <= now())
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at
ON public.posts (status, published_at DESC);
