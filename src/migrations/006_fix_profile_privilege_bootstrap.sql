-- Migration: 006_fix_profile_privilege_bootstrap.sql
-- Description: Memperbaiki fungsi trigger check_profile_privilege_changes untuk mendukung:
-- 1. Eksekusi langsung Database Administrator / Supabase SQL Editor / Service Role (auth.uid() IS NULL)
-- 2. Bootstrap Mode otomatis: Memperbolehkan promosi Super Admin pertama jika belum ada akun Super Admin aktif di sistem
-- 3. Tetap memblokir eskalasi hak akses (privilege escalation) jika dipanggil oleh user non-Super Admin melalui client Web/API

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
