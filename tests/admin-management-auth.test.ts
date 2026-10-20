import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateUserProfile,
  validateAdminRole,
  validateSuperAdminRole,
  type AuthenticatedUser,
  type RawAuthUser,
  type RawProfile,
} from '../src/lib/auth/guards.ts';
import {
  executeCreateAdminUser,
  executeToggleUserStatus,
  executeResetUserPassword,
  type AccountServiceDeps,
} from '../src/lib/accounts/service.ts';
import {
  executeSaveSettings,
  type SettingsServiceDeps,
} from '../src/lib/settings/service.ts';
import { AuthError, AppError } from '../src/lib/action-response.ts';
import type { AdminAccountItem } from '../src/types/accounts.ts';
import type { SystemSettingsPayload } from '../src/types/settings.ts';
import type { AuditLogEntry } from '../src/lib/audit/types.ts';

describe('Admin Management & Settings Authorization Suite (Tahap 8 - PRD §5, §6.1, §15.2–15.3)', () => {
  // Mock Data
  const superAdminUser: AuthenticatedUser = {
    id: 'sa-001',
    email: 'superadmin@frasaklausa.id',
    fullName: 'Super Admin Utama',
    avatarUrl: null,
    role: 'super_admin',
    isActive: true,
  };

  const regularAdminUser: AuthenticatedUser = {
    id: 'adm-001',
    email: 'admin@frasaklausa.id',
    fullName: 'Admin Redaksi',
    avatarUrl: null,
    role: 'admin',
    isActive: true,
  };

  const inactiveUser: RawProfile = {
    id: 'inact-001',
    full_name: 'Admin Nonaktif',
    avatar_url: null,
    role: 'admin',
    is_active: false,
  };

  const rawUser: RawAuthUser = {
    id: 'inact-001',
    email: 'inactive@frasaklausa.id',
  };

  function createMockAccountDeps(
    caller: AuthenticatedUser,
    activeSuperAdmins = 2
  ): {
    deps: AccountServiceDeps;
    auditLogs: AuditLogEntry[];
    createdUsers: Record<string, unknown>[];
    statusUpdates: { id: string; isActive: boolean }[];
  } {
    const auditLogs: AuditLogEntry[] = [];
    const createdUsers: Record<string, unknown>[] = [];
    const statusUpdates: { id: string; isActive: boolean }[] = [];

    const dummyAccounts: Record<string, AdminAccountItem> = {
      'sa-001': {
        id: 'sa-001',
        email: 'superadmin@frasaklausa.id',
        fullName: 'Super Admin Utama',
        avatarUrl: null,
        role: 'super_admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'sa-002': {
        id: 'sa-002',
        email: 'superadmin2@frasaklausa.id',
        fullName: 'Super Admin Cadangan',
        avatarUrl: null,
        role: 'super_admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'adm-001': {
        id: 'adm-001',
        email: 'admin@frasaklausa.id',
        fullName: 'Admin Redaksi',
        avatarUrl: null,
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const deps: AccountServiceDeps = {
      auth: {
        requireSuperAdmin: async () => {
          return validateSuperAdminRole(caller);
        },
      },
      rateLimit: {
        checkCreateLimit: async () => ({ success: true }),
        checkResetLimit: async () => ({ success: true }),
      },
      authAdmin: {
        createUser: async (params) => {
          createdUsers.push(params);
          return {
            data: { user: { id: 'new-user-123', email: params.email } },
            error: null,
          };
        },
        resetPasswordForEmail: async () => ({ error: null }),
      },
      db: {
        getAccountById: async (id) => dummyAccounts[id] ?? null,
        countActiveSuperAdmins: async () => activeSuperAdmins,
        updateUserActiveStatus: async (userId, isActive) => {
          statusUpdates.push({ id: userId, isActive });
          return { success: true };
        },
      },
      audit: {
        record: async (entry) => {
          auditLogs.push(entry);
        },
      },
    };

    return { deps, auditLogs, createdUsers, statusUpdates };
  }

  function createMockSettingsDeps(caller: AuthenticatedUser): {
    deps: SettingsServiceDeps;
    auditLogs: AuditLogEntry[];
    savedSettings: Record<string, unknown>;
  } {
    const auditLogs: AuditLogEntry[] = [];
    const savedSettings: Record<string, unknown> = {};

    const mockSettingsPayload: SystemSettingsPayload = {
      general: {
        site_name: 'Frasa Klausa Media',
        site_tagline: 'Penerbit Buku',
        contact_email: 'frasaklausamedia@gmail.com',
        contact_phone: '0813-8060-4256',
        contact_whatsapp: '0813-8060-4256',
        office_address: 'Jakarta',
        default_meta_description: 'Deskripsi penerbit',
      },
      features: {
        enable_blog_comments: false,
        enable_public_registration: false,
        maintenance_mode: false,
        enable_marketplace_redirect: true,
      },
    };

    const deps: SettingsServiceDeps = {
      auth: {
        requireSuperAdmin: async () => {
          return validateSuperAdminRole(caller);
        },
      },
      db: {
        getSettings: async () => mockSettingsPayload,
        updateSettings: async (key, val) => {
          savedSettings[key] = val;
          return { success: true };
        },
      },
      audit: {
        record: async (entry) => {
          auditLogs.push(entry);
        },
      },
    };

    return { deps, auditLogs, savedSettings };
  }

  describe('1. Penegakan Otorisasi Server requireSuperAdmin() (HTTP 403 untuk Admin Biasa)', () => {
    it('menolak admin biasa yang memanggil fungsi pembuat akun baru dengan 403 Forbidden', async () => {
      const { deps } = createMockAccountDeps(regularAdminUser);

      await assert.rejects(
        async () => {
          await executeCreateAdminUser(deps, {
            email: 'baru@frasaklausa.id',
            fullName: 'Admin Baru',
            temporaryPassword: 'Password123',
          });
        },
        (err: unknown) => {
          assert(err instanceof AuthError);
          assert.equal(err.status, 403);
          assert.match(err.message, /Super Admin/i);
          return true;
        }
      );
    });

    it('menolak admin biasa yang memanggil toggle status keaktifan akun dengan 403 Forbidden', async () => {
      const { deps } = createMockAccountDeps(regularAdminUser);

      await assert.rejects(
        async () => {
          await executeToggleUserStatus(deps, {
            userId: 'adm-001',
            isActive: false,
          });
        },
        (err: unknown) => {
          assert(err instanceof AuthError);
          assert.equal(err.status, 403);
          return true;
        }
      );
    });

    it('menolak admin biasa yang memanggil reset kata sandi dengan 403 Forbidden', async () => {
      const { deps } = createMockAccountDeps(regularAdminUser);

      await assert.rejects(
        async () => {
          await executeResetUserPassword(deps, {
            userId: 'adm-001',
          });
        },
        (err: unknown) => {
          assert(err instanceof AuthError);
          assert.equal(err.status, 403);
          return true;
        }
      );
    });

    it('menolak admin biasa yang mencoba menyimpan pengaturan platform dengan 403 Forbidden', async () => {
      const { deps } = createMockSettingsDeps(regularAdminUser);

      await assert.rejects(
        async () => {
          await executeSaveSettings(deps, {
            general: {
              site_name: 'Perubahan Ilegal',
              site_tagline: 'Tagline Baru',
              contact_email: 'test@mail.com',
              contact_phone: '08123456789',
              contact_whatsapp: '08123456789',
              office_address: 'Jakarta',
              default_meta_description: 'Deskripsi lengkap minimal sepuluh karakter',
            },
            features: {
              enable_blog_comments: false,
              enable_public_registration: false,
              maintenance_mode: false,
              enable_marketplace_redirect: true,
            },
          });
        },
        (err: unknown) => {
          assert(err instanceof AuthError);
          assert.equal(err.status, 403);
          return true;
        }
      );
    });
  });

  describe('2. Izin Penuh untuk Super Admin yang Sah', () => {
    it('mengizinkan Super Admin membuat akun admin baru dan mencatat audit log', async () => {
      const { deps, auditLogs, createdUsers } = createMockAccountDeps(superAdminUser);

      const result = await executeCreateAdminUser(deps, {
        email: 'editor@frasaklausa.id',
        fullName: 'Editor Baru',
        temporaryPassword: 'Password123',
      });

      assert.equal(result.success, true);
      assert.equal(createdUsers.length, 1);
      assert.equal(createdUsers[0].email, 'editor@frasaklausa.id');
      assert.equal(createdUsers[0].email_confirm, true);
      assert.equal(createdUsers[0].user_metadata.role, 'admin');

      // Audit log tercatat
      assert.equal(auditLogs.length, 1);
      assert.equal(auditLogs[0].action, 'user.create');
      assert.equal(auditLogs[0].actorId, 'sa-001');
      assert.equal(auditLogs[0].status, 'success');
    });

    it('mengizinkan Super Admin menyimpan pengaturan dan mencatat audit log', async () => {
      const { deps, auditLogs, savedSettings } = createMockSettingsDeps(superAdminUser);

      const result = await executeSaveSettings(deps, {
        general: {
          site_name: 'Frasa Klausa Media Official',
          site_tagline: 'Penerbitan Berkualitas',
          contact_email: 'official@frasaklausa.id',
          contact_phone: '081234567890',
          contact_whatsapp: '081234567890',
          office_address: 'Jakarta Selatan',
          default_meta_description: 'Deskripsi lengkap resmi minimal sepuluh karakter',
        },
        features: {
          enable_blog_comments: true,
          enable_public_registration: false,
          maintenance_mode: false,
          enable_marketplace_redirect: true,
        },
      });

      assert.equal(result.success, true);
      assert.equal(savedSettings.general.site_name, 'Frasa Klausa Media Official');
      assert.equal(savedSettings.features.enable_blog_comments, true);

      assert.equal(auditLogs.length, 1);
      assert.equal(auditLogs[0].action, 'settings.update');
      assert.equal(auditLogs[0].actorId, 'sa-001');
    });
  });

  describe('3. Proteksi Anti-Lockout Super Admin', () => {
    it('menolak Super Admin yang mencoba menonaktifkan akun miliknya sendiri', async () => {
      const { deps } = createMockAccountDeps(superAdminUser, 2);

      await assert.rejects(
        async () => {
          await executeToggleUserStatus(deps, {
            userId: 'sa-001', // ID miliknya sendiri
            isActive: false,
          });
        },
        (err: unknown) => {
          assert(err instanceof AppError);
          assert.equal(err.status, 403);
          assert.match(err.message, /tidak dapat menonaktifkan akun Anda sendiri/i);
          return true;
        }
      );
    });

    it('menolak penonaktifan Super Admin terakhir yang tersisa di sistem', async () => {
      // Hanya tersisa 1 Super Admin aktif
      const { deps } = createMockAccountDeps(superAdminUser, 1);

      await assert.rejects(
        async () => {
          await executeToggleUserStatus(deps, {
            userId: 'sa-002', // Target adalah Super Admin lain
            isActive: false,
          });
        },
        (err: unknown) => {
          assert(err instanceof AppError);
          assert.equal(err.status, 403);
          assert.match(err.message, /Super Admin terakhir/i);
          return true;
        }
      );
    });
  });

  describe('4. Pemblokiran Langsung Akun Nonaktif (is_active: false)', () => {
    it('validateUserProfile melempar 403 Forbidden jika akun berstatus is_active = false', () => {
      assert.throws(
        () => {
          validateUserProfile(rawUser, inactiveUser);
        },
        (err: unknown) => {
          assert(err instanceof AuthError);
          assert.equal(err.status, 403);
          assert.match(err.message, /dinonaktifkan/i);
          return true;
        }
      );
    });

    it('validateAdminRole menolak user nonaktif bahkan jika role-nya super_admin', () => {
      assert.throws(
        () => {
          validateAdminRole(rawUser, {
            ...inactiveUser,
            role: 'super_admin',
            is_active: false,
          });
        },
        (err: unknown) => {
          assert(err instanceof AuthError);
          assert.equal(err.status, 403);
          return true;
        }
      );
    });
  });
});
