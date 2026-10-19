import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createAdminUserSchema,
  toggleUserStatusSchema,
  resetUserPasswordSchema,
  accountQuerySchema,
} from '../src/validations/account.ts';
import {
  generalSettingsSchema,
  featureSettingsSchema,
  systemSettingsFormSchema,
} from '../src/validations/settings.ts';
import {
  USER_CREATE_RATE_LIMIT_CONFIG,
  USER_RESET_RATE_LIMIT_CONFIG,
} from '../src/lib/rate-limit/types.ts';

describe('Admin Management & Settings Validations Suite (Tahap 8 - PRD §6.1, §15.4)', () => {
  describe('1. Skema Pembuatan Akun Admin Baru (createAdminUserSchema)', () => {
    it('menerima payload pembuatan akun admin yang valid dan lengkap', () => {
      const validData = {
        email: 'Admin.Baru@FrasaKlausa.id ',
        fullName: 'Admin Redaksi Pratama',
        temporaryPassword: 'PasswordKuat123',
      };

      const result = createAdminUserSchema.safeParse(validData);
      assert.equal(result.success, true);
      if (result.success) {
        // Memastikan email di-trim dan di-lowercase
        assert.equal(result.data.email, 'admin.baru@frasaklausa.id');
        assert.equal(result.data.fullName, 'Admin Redaksi Pratama');
      }
    });

    it('menolak email dengan format tidak valid', () => {
      const invalidData = {
        email: 'bukan-email-valid',
        fullName: 'Admin Baru',
        temporaryPassword: 'PasswordKuat123',
      };

      const result = createAdminUserSchema.safeParse(invalidData);
      assert.equal(result.success, false);
      if (!result.success) {
        assert(result.error.issues.some((i) => i.path.includes('email')));
      }
    });

    it('menolak nama lengkap yang terlalu pendek (< 2 karakter)', () => {
      const invalidData = {
        email: 'admin@frasaklausa.id',
        fullName: 'A',
        temporaryPassword: 'PasswordKuat123',
      };

      const result = createAdminUserSchema.safeParse(invalidData);
      assert.equal(result.success, false);
      if (!result.success) {
        assert(result.error.issues.some((i) => i.path.includes('fullName')));
      }
    });

    it('menolak kata sandi sementara yang lemah (kurang dari 8 karakter)', () => {
      const invalidData = {
        email: 'admin@frasaklausa.id',
        fullName: 'Admin Baru',
        temporaryPassword: 'Pass1',
      };

      const result = createAdminUserSchema.safeParse(invalidData);
      assert.equal(result.success, false);
      if (!result.success) {
        assert(result.error.issues.some((i) => i.path.includes('temporaryPassword')));
      }
    });

    it('menolak kata sandi sementara yang tidak mengandung angka', () => {
      const invalidData = {
        email: 'admin@frasaklausa.id',
        fullName: 'Admin Baru',
        temporaryPassword: 'HanyaHurufSaja',
      };

      const result = createAdminUserSchema.safeParse(invalidData);
      assert.equal(result.success, false);
      if (!result.success) {
        assert(result.error.issues.some((i) => i.path.includes('temporaryPassword')));
      }
    });

    it('menolak kata sandi sementara yang tidak mengandung huruf', () => {
      const invalidData = {
        email: 'admin@frasaklausa.id',
        fullName: 'Admin Baru',
        temporaryPassword: '1234567890',
      };

      const result = createAdminUserSchema.safeParse(invalidData);
      assert.equal(result.success, false);
      if (!result.success) {
        assert(result.error.issues.some((i) => i.path.includes('temporaryPassword')));
      }
    });
  });

  describe('2. Skema Toggle Status dan Reset Password', () => {
    it('menerima toggleUserStatusSchema yang valid dengan UUID', () => {
      const valid = {
        userId: '11111111-1111-4111-8111-111111111101',
        isActive: false,
      };
      const result = toggleUserStatusSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('menolak toggleUserStatusSchema jika userId bukan UUID', () => {
      const invalid = {
        userId: 'bukan-uuid',
        isActive: true,
      };
      const result = toggleUserStatusSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });

    it('menerima resetUserPasswordSchema yang valid dengan UUID', () => {
      const valid = {
        userId: '11111111-1111-4111-8111-111111111101',
      };
      const result = resetUserPasswordSchema.safeParse(valid);
      assert.equal(result.success, true);
    });
  });

  describe('3. Skema Parameter Query Akun (accountQuerySchema)', () => {
    it('menerapkan nilai default jika parameter query kosong', () => {
      const result = accountQuerySchema.parse({});
      assert.equal(result.page, 1);
      assert.equal(result.pageSize, 10);
      assert.equal(result.status, 'all');
      assert.equal(result.role, 'all');
      assert.equal(result.q, '');
    });

    it('melakukan parsing dan sanitasi string pencarian serta pagination', () => {
      const result = accountQuerySchema.parse({
        q: '  budi redaksi  ',
        status: 'active',
        role: 'admin',
        page: '3',
        pageSize: '20',
      });
      assert.equal(result.q, 'budi redaksi');
      assert.equal(result.status, 'active');
      assert.equal(result.role, 'admin');
      assert.equal(result.page, 3);
      assert.equal(result.pageSize, 20);
    });
  });

  describe('4. Skema Pengaturan Sistem & Deteksi Kebocoran Secret (PRD §15.1, §15.4)', () => {
    it('menerima konfigurasi umum dan fitur platform yang valid', () => {
      const validData = {
        general: {
          site_name: 'Frasa Klausa Media',
          site_tagline: 'Penerbit Buku Berkualitas',
          contact_email: 'frasaklausamedia@gmail.com',
          contact_phone: '0813-8060-4256',
          contact_whatsapp: '0813-8060-4256',
          office_address: 'Jakarta, Indonesia',
          default_meta_description: 'Penerbitan buku sastra dan fiksi berkualitas tinggi.',
        },
        features: {
          enable_blog_comments: false,
          enable_public_registration: false,
          maintenance_mode: false,
          enable_marketplace_redirect: true,
        },
      };

      const result = systemSettingsFormSchema.safeParse(validData);
      assert.equal(result.success, true);
    });

    it('menolak pengaturan jika mendeteksi token/secret JWT pada input teks', () => {
      const dataWithSecret = {
        general: {
          site_name: 'Frasa Klausa Media',
          site_tagline: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          contact_email: 'frasaklausamedia@gmail.com',
          contact_phone: '0813-8060-4256',
          contact_whatsapp: '0813-8060-4256',
          office_address: 'Jakarta',
          default_meta_description: 'Deskripsi panjang minimal sepuluh karakter.',
        },
        features: {
          enable_blog_comments: false,
          enable_public_registration: false,
          maintenance_mode: false,
          enable_marketplace_redirect: true,
        },
      };

      const result = systemSettingsFormSchema.safeParse(dataWithSecret);
      assert.equal(result.success, false);
      if (!result.success) {
        assert(result.error.issues.some((i) => i.message.includes('token autentikasi atau secret')));
      }
    });

    it('menolak jika nama situs kosong atau terlalu pendek', () => {
      const invalidData = {
        site_name: 'A',
        site_tagline: 'Tagline',
        contact_email: 'info@frasaklausa.id',
        contact_phone: '0812345678',
        contact_whatsapp: '0812345678',
        office_address: '',
        default_meta_description: 'Deskripsi SEO minimal sepuluh karakter',
      };

      const result = generalSettingsSchema.safeParse(invalidData);
      assert.equal(result.success, false);
    });
  });

  describe('5. Konfigurasi Batasan Laju (Rate Limiting)', () => {
    it('memastikan konfigurasi rate limit pembuatan akun sesuai standar (5 req / 15 min)', () => {
      assert.equal(USER_CREATE_RATE_LIMIT_CONFIG.limit, 5);
      assert.equal(USER_CREATE_RATE_LIMIT_CONFIG.windowSeconds, 900);
    });

    it('memastikan konfigurasi rate limit reset password sesuai standar (3 req / 15 min)', () => {
      assert.equal(USER_RESET_RATE_LIMIT_CONFIG.limit, 3);
      assert.equal(USER_RESET_RATE_LIMIT_CONFIG.windowSeconds, 900);
    });
  });
});
