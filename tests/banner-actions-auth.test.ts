import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUserProfile,
  validateAdminRole,
  type RawAuthUser,
  type RawProfile,
} from '../src/lib/auth/guards.ts';
import {
  executeCreateBanner,
  executeUpdateBanner,
  executeDeleteBanner,
  executeToggleBannerActive,
} from '../src/lib/banners/service.ts';
import type { BannerServiceDeps, Banner } from '../src/lib/banners/types.ts';
import type { BannerFormInput } from '../src/validations/banner.ts';

describe('Banner Actions Authorization & Service Suite (Tahap 7 - PRD §5 & §15.3)', () => {
  const dummyBannerInput: BannerFormInput = {
    message: 'Promo Peluncuran Buku Spesial Diskon 15%',
    link_url: '/buku/jejak-sunyi',
    starts_at: '2026-10-25T00:00:00.000Z',
    ends_at: '2026-10-30T23:59:59.000Z',
    is_active: true,
  };

  const dummyBanner: Banner = {
    id: 'b-123',
    message: 'Promo Peluncuran Buku Spesial Diskon 15%',
    link_url: '/buku/jejak-sunyi',
    starts_at: '2026-10-25T00:00:00.000Z',
    ends_at: '2026-10-30T23:59:59.000Z',
    is_active: true,
    created_at: '2026-10-24T00:00:00.000Z',
    updated_at: '2026-10-24T00:00:00.000Z',
  };

  function createMockDeps(
    user: RawAuthUser | null,
    profile: RawProfile | null,
    overrides?: Partial<BannerServiceDeps['db']>
  ): {
    deps: BannerServiceDeps;
    revalidatedPaths: string[];
    revalidatedTags: string[];
  } {
    const revalidatedPaths: string[] = [];
    const revalidatedTags: string[] = [];

    const deps: BannerServiceDeps = {
      auth: {
        requireAdmin: async () => {
          const authUser = validateUserProfile(user, profile);
          return validateAdminRole(authUser);
        },
      },
      db: {
        getBannerById: async (id) => (id === dummyBanner.id ? dummyBanner : null),
        createBanner: async () => dummyBanner,
        updateBanner: async () => dummyBanner,
        deleteBanner: async () => {},
        toggleActive: async (_id, isActive) => ({ ...dummyBanner, is_active: isActive }),
        ...overrides,
      },
      revalidate: {
        revalidatePaths: (paths) => revalidatedPaths.push(...paths),
        revalidateTags: (tags) => revalidatedTags.push(...tags),
      },
      logger: {
        error: () => {},
        info: () => {},
      },
    };

    return { deps, revalidatedPaths, revalidatedTags };
  }

  describe('1. Penolakan Akses Tanpa Autentikasi / Otorisasi', () => {
    it('menolak pengguna yang belum login (unauthenticated)', async () => {
      const { deps } = createMockDeps(null, null);

      await assert.rejects(
        async () => executeCreateBanner(dummyBannerInput, deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );

      await assert.rejects(
        async () => executeUpdateBanner('b-123', dummyBannerInput, deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );

      await assert.rejects(
        async () => executeDeleteBanner('b-123', deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );

      await assert.rejects(
        async () => executeToggleBannerActive('b-123', false, deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );
    });

    it('menolak akun pengguna yang dinonaktifkan (isActive: false)', async () => {
      const inactiveUser: RawAuthUser = { id: 'u-1', email: 'inactive@test.com' };
      const inactiveProfile: RawProfile = { id: 'u-1', role: 'admin', is_active: false };
      const { deps } = createMockDeps(inactiveUser, inactiveProfile);

      await assert.rejects(
        async () => executeCreateBanner(dummyBannerInput, deps),
        /dinonaktifkan/i
      );
    });
  });

  describe('2. Keberhasilan Eksekusi & Revalidasi Cache oleh Admin Berwenang', () => {
    const adminUser: RawAuthUser = { id: 'u-admin', email: 'admin@test.com' };
    const adminProfile: RawProfile = { id: 'u-admin', role: 'admin', is_active: true };

    it('executeCreateBanner berhasil menyimpan data dan merevalidasi cache tag "active-banner"', async () => {
      const { deps, revalidatedTags, revalidatedPaths } = createMockDeps(adminUser, adminProfile);

      const res = await executeCreateBanner(dummyBannerInput, deps);

      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.data?.id, 'b-123');
      assert.ok(revalidatedTags.includes('active-banner'), 'Wajib merevalidasi tag active-banner');
      assert.ok(revalidatedPaths.includes('/'), 'Wajib merevalidasi rute beranda publik');
      assert.ok(revalidatedPaths.includes('/admin/banners'), 'Wajib merevalidasi rute tabel admin');
    });

    it('executeUpdateBanner berhasil memperbarui data', async () => {
      const { deps, revalidatedTags } = createMockDeps(adminUser, adminProfile);

      const res = await executeUpdateBanner('b-123', dummyBannerInput, deps);

      assert.strictEqual(res.ok, true);
      assert.ok(revalidatedTags.includes('active-banner'));
    });

    it('executeUpdateBanner mengembalikan NOT_FOUND jika banner tidak ada', async () => {
      const { deps } = createMockDeps(adminUser, adminProfile, {
        getBannerById: async () => null,
      });

      const res = await executeUpdateBanner('b-999', dummyBannerInput, deps);

      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error?.code, 'NOT_FOUND');
    });

    it('executeToggleBannerActive mengubah status dan memicu revalidasi', async () => {
      const { deps, revalidatedTags } = createMockDeps(adminUser, adminProfile);

      const res = await executeToggleBannerActive('b-123', false, deps);

      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.data?.is_active, false);
      assert.ok(revalidatedTags.includes('active-banner'));
    });

    it('executeDeleteBanner menghapus banner dan memicu revalidasi', async () => {
      let deletedId: string | null = null;
      const { deps, revalidatedTags } = createMockDeps(adminUser, adminProfile, {
        deleteBanner: async (id) => {
          deletedId = id;
        },
      });

      const res = await executeDeleteBanner('b-123', deps);

      assert.strictEqual(res.ok, true);
      assert.strictEqual(deletedId, 'b-123');
      assert.ok(revalidatedTags.includes('active-banner'));
    });
  });
});

