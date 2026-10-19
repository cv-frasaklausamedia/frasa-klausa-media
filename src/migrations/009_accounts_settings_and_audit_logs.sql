-- Migration: 009_accounts_settings_and_audit_logs.sql
-- Description: Tahap 8 — Manajemen Akun & Pengaturan Sistem (Khusus Super Admin):
-- 1. Penambahan kolom email pada tabel public.profiles dan sinkronisasi otomatis dari auth.users
-- 2. Trigger pertahanan check_profile_privilege_changes diperluas: anti self-deactivation & proteksi Super Admin terakhir
-- 3. Tabel append-only public.audit_logs untuk rekaman audit aksi administratif sensitif
-- 4. Tabel public.system_settings dan view public.pengaturan untuk konfigurasi platform aman tanpa secret

-- ============================================================================
-- 1. PENYEMPURNAAN TABEL PROFILES DENGAN KOLOM EMAIL
-- ============================================================================

-- Tambah kolom email pada public.profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Indeks performa untuk pencarian email dan status keaktifan akun
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Backfill data email yang sudah ada dari auth.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
  END IF;
END $$;

-- Perbarui fungsi trigger handle_new_user() agar otomatis menyalin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Admin Frasa Klausa'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'admin'::public.user_role),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Perbarui fungsi pertahanan hak akses check_profile_privilege_changes()
-- Mendukung proteksi anti-self-deactivation dan pencegahan penonaktifan Super Admin terakhir
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
  v_active_super_admin_count integer;
BEGIN
  -- Jika role atau is_active diubah:
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_active IS DISTINCT FROM OLD.is_active) THEN

    -- 1. Database Admin / SQL Editor / Service Role bypass:
    -- Ketika query dijalankan via SQL Editor atau koneksi direct psql/service_role, auth.uid() bernilai NULL.
    IF auth.uid() IS NULL THEN
      -- Tetap cegah penonaktifan Super Admin terakhir bahkan melalui direct DB call jika tidak disengaja
      IF OLD.role = 'super_admin' AND OLD.is_active = true AND NEW.is_active = false THEN
        SELECT count(*) INTO v_active_super_admin_count
        FROM public.profiles
        WHERE role = 'super_admin' AND is_active = true;

        IF v_active_super_admin_count <= 1 THEN
          RAISE EXCEPTION 'Tidak dapat menonaktifkan Super Admin terakhir dalam sistem.';
        END IF;
      END IF;

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

    -- User tidak boleh menonaktifkan akun miliknya sendiri
    IF auth.uid() = OLD.id AND NEW.is_active IS DISTINCT FROM OLD.is_active AND NEW.is_active = false THEN
      RAISE EXCEPTION 'Super Admin tidak diperbolehkan menonaktifkan akun miliknya sendiri.';
    END IF;

    -- Cek pencegahan penonaktifan Super Admin terakhir yang tersisa di sistem
    IF OLD.role = 'super_admin' AND OLD.is_active = true AND NEW.is_active = false THEN
      SELECT count(*) INTO v_active_super_admin_count
      FROM public.profiles
      WHERE role = 'super_admin' AND is_active = true;

      IF v_active_super_admin_count <= 1 THEN
        RAISE EXCEPTION 'Tidak dapat menonaktifkan Super Admin terakhir dalam sistem.';
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================================
-- 2. TABEL AUDIT_LOGS (APPEND-ONLY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  status text NOT NULL DEFAULT 'success',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indeks performa audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Perlindungan sifat append-only di tingkat database engine (Immutable Audit Trail)
CREATE OR REPLACE RULE audit_logs_no_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_logs_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- RLS untuk audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());


-- ============================================================================
-- 3. TABEL SYSTEM_SETTINGS & VIEW PENGATURAN
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- View pengaturan untuk kesesuaian PRD dan preferensi penamaan
CREATE OR REPLACE VIEW public.pengaturan AS
  SELECT * FROM public.system_settings;

-- RLS untuk system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;
CREATE POLICY "system_settings_select_policy" ON public.system_settings
  FOR SELECT TO authenticated
  USING (public.is_active_admin());

DROP POLICY IF EXISTS "system_settings_insert_policy" ON public.system_settings;
CREATE POLICY "system_settings_insert_policy" ON public.system_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "system_settings_update_policy" ON public.system_settings;
CREATE POLICY "system_settings_update_policy" ON public.system_settings
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Inisialisasi data default konfigurasi platform (bebas credential & secret)
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('general', '{
    "site_name": "Frasa Klausa Media",
    "site_tagline": "Penerbit Buku Berkualitas & Ruang Literasi Terbuka",
    "contact_email": "frasaklausamedia@gmail.com",
    "contact_phone": "0813-8060-4256",
    "contact_whatsapp": "0813-8060-4256",
    "office_address": "Jakarta, Indonesia",
    "default_meta_description": "Penerbit buku independen yang menghadirkan karya sastra, fiksi, puisi, dan esai pemikiran bermutu."
  }'::jsonb, 'Konfigurasi umum identitas situs dan kontak resmi penerbit'),
  ('features', '{
    "enable_blog_comments": false,
    "enable_public_registration": false,
    "maintenance_mode": false,
    "enable_marketplace_redirect": true
  }'::jsonb, 'Toggle fitur platform dan ketersediaan layanan publik')
ON CONFLICT (key) DO NOTHING;
