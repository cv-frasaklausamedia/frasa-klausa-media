-- Migration: 005_rate_limits.sql
-- Description: Tabel dan fungsi atomic untuk Rate Limiting persisten di lingkungan Serverless.

-- 1. Tabel rate_limit_attempts
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indeks untuk efisiensi query dan pembersihan otomatis (cleanup)
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_reset_at 
ON public.rate_limit_attempts (reset_at);

-- 2. Keamanan: Aktifkan RLS dan tolak seluruh akses publik langsung
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Cabut seluruh permission dari anon dan authenticated agar tabel hanya dapat diakses melalui fungsi RPC atau service role
REVOKE ALL ON TABLE public.rate_limit_attempts FROM anon, authenticated;
GRANT ALL ON TABLE public.rate_limit_attempts TO service_role;

-- 3. Fungsi RPC Atomic untuk Check Rate Limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_new_reset timestamptz := v_now + (p_window_seconds || ' seconds')::interval;
  v_entry record;
  v_success boolean;
  v_remaining integer;
  v_reset_epoch bigint;
BEGIN
  -- Coba ambil entri yang ada dengan lock row (FOR UPDATE)
  SELECT * INTO v_entry
  FROM public.rate_limit_attempts
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND OR v_entry.reset_at <= v_now THEN
    -- Entri belum ada atau sudah kadaluarsa: buat baru / reset
    INSERT INTO public.rate_limit_attempts (key, count, reset_at, updated_at)
    VALUES (p_key, 1, v_new_reset, v_now)
    ON CONFLICT (key) DO UPDATE
      SET count = 1,
          reset_at = v_new_reset,
          updated_at = v_now;

    v_success := true;
    v_remaining := GREATEST(0, p_max_attempts - 1);
    v_reset_epoch := EXTRACT(EPOCH FROM v_new_reset)::bigint;
  ELSE
    -- Entri masih dalam jendela aktif
    IF v_entry.count >= p_max_attempts THEN
      v_success := false;
      v_remaining := 0;
      v_reset_epoch := EXTRACT(EPOCH FROM v_entry.reset_at)::bigint;
    ELSE
      UPDATE public.rate_limit_attempts
      SET count = count + 1,
          updated_at = v_now
      WHERE key = p_key;

      v_success := true;
      v_remaining := GREATEST(0, p_max_attempts - (v_entry.count + 1));
      v_reset_epoch := EXTRACT(EPOCH FROM v_entry.reset_at)::bigint;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', v_success,
    'limit', p_max_attempts,
    'remaining', v_remaining,
    'reset', v_reset_epoch
  );
END;
$$;

-- Hak eksekusi fungsi check_rate_limit hanya untuk service_role
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;
