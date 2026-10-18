# Panduan Setup Akun Pengelola Awal (Super Admin & Admin)

Dokumen ini menjelaskan prosedur setup akun awal untuk platform Frasa Klausa Media dengan aman.

---

## 1. Daftar Akun Pengelola Awal

| No | Tipe Role | Email | Password Awal | Status Akun |
| :-- | :-------- | :---- | :------------ | :---------- |
| 1 | **Super Admin** | `super.admin@frasaklausamedia.com` | `!Admin123` | Aktif (`is_active = true`) |
| 2 | **Admin** | `admin@frasaklausamedia.com` | `!Admin123` | Aktif (`is_active = true`) |

---

## Opsi 1: Menggunakan SQL Query Langsung di Supabase SQL Editor (Direkomendasikan)

Jalankan kueri SQL berikut di **Supabase Dashboard -> SQL Editor** setelah migrasi skema tabel (Tahap 1) telah selesai diterapkan:

```sql
-- Pastikan ekstensi pgcrypto aktif untuk enkripsi password bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  super_admin_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid();
  default_pass text := '!Admin123';
BEGIN
  -- 1. Insert Akun Super Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'super.admin@frasaklausamedia.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      super_admin_id,
      'authenticated',
      'authenticated',
      'super.admin@frasaklausamedia.com',
      crypt(default_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin Frasa Klausa Media","role":"super_admin"}'::jsonb,
      now(),
      now()
    );

    -- Update profil ke super_admin (trigger handle_new_user akan membuat record di profiles)
    UPDATE public.profiles
    SET 
      full_name = 'Super Admin Frasa Klausa Media',
      role = 'super_admin'::user_role,
      is_active = true
    WHERE id = super_admin_id;

    RAISE NOTICE 'Akun Super Admin berhasil dibuat: super.admin@frasaklausamedia.com';
  ELSE
    UPDATE public.profiles
    SET role = 'super_admin'::user_role, is_active = true
    WHERE id = (SELECT id FROM auth.users WHERE email = 'super.admin@frasaklausamedia.com');
  END IF;

  -- 2. Insert Akun Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@frasaklausamedia.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@frasaklausamedia.com',
      crypt(default_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin Frasa Klausa Media","role":"admin"}'::jsonb,
      now(),
      now()
    );

    -- Update profil ke admin
    UPDATE public.profiles
    SET 
      full_name = 'Admin Frasa Klausa Media',
      role = 'admin'::user_role,
      is_active = true
    WHERE id = admin_id;

    RAISE NOTICE 'Akun Admin berhasil dibuat: admin@frasaklausamedia.com';
  ELSE
    UPDATE public.profiles
    SET role = 'admin'::user_role, is_active = true
    WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@frasaklausamedia.com');
  END IF;

END $$;
```

---

## Opsi 2: Melalui Dashboard Supabase (Manual UI)

1. Buka dashboard proyek Supabase Anda:
   `https://supabase.com/dashboard/project/<PROJECT_ID>/auth/users`
2. Klik tombol **Add user** -> **Create user**.
3. Buat kedua user berikut (centang **Auto Confirm User?**):
   - `super.admin@frasaklausamedia.com` (password: `!Admin123`)
   - `admin@frasaklausamedia.com` (password: `!Admin123`)
4. Buka **SQL Editor** di dashboard Supabase dan jalankan kueri berikut:

```sql
UPDATE public.profiles
SET full_name = 'Super Admin Frasa Klausa Media', role = 'super_admin'::user_role, is_active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'super.admin@frasaklausamedia.com');

UPDATE public.profiles
SET full_name = 'Admin Frasa Klausa Media', role = 'admin'::user_role, is_active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@frasaklausamedia.com');
```

---

## Verifikasi Akun Pengelola

Jalankan kueri berikut untuk memastikan kedua akun telah terdaftar dengan role yang tepat:

```sql
SELECT p.id, u.email, p.full_name, p.role, p.is_active, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.role DESC;
```

---

## Opsi 3: Pembuatan Akun Admin Selanjutnya (Via CMS)

Setelah akun Super Admin pertama aktif, pembuatan akun Admin selanjutnya **tidak perlu lagi melalui SQL Editor atau Supabase Dashboard**.
Super Admin dapat langsung mengundang dan membuat akun Admin dari modal CMS Admin di aplikasi web menggunakan Server Action (`supabase.auth.admin.createUser()`) sesuai spesifikasi PRD §6.1.
