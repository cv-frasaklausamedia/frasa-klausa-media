import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUserProfile,
  validateAdminRole,
  type RawAuthUser,
  type RawProfile,
} from '../src/lib/auth/guards.ts';
import {
  executeSaveHeroContent,
  executeSaveAboutContent,
  executeSaveContactContent,
  executeSaveSocialContent,
  executeUploadSiteImage,
} from '../src/lib/site-content/service.ts';
import type { SiteContentServiceDeps } from '../src/lib/site-content/types.ts';
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_SOCIAL_CONTENT,
} from '../src/lib/site-content/defaults.ts';

describe('Site Content Actions Authorization & Upload Suite (Tahap 7 - PRD §5 & §15.3)', () => {
  function createMockDeps(
    user: RawAuthUser | null,
    profile: RawProfile | null,
    overrides?: Partial<SiteContentServiceDeps['db']>
  ): {
    deps: SiteContentServiceDeps;
    revalidatedPaths: string[];
    revalidatedTags: string[];
    savedData: Record<string, unknown>;
  } {
    const revalidatedPaths: string[] = [];
    const revalidatedTags: string[] = [];
    const savedData: Record<string, unknown> = {};

    const deps: SiteContentServiceDeps = {
      auth: {
        requireAdmin: async () => {
          const authUser = validateUserProfile(user, profile);
          return validateAdminRole(authUser);
        },
      },
      db: {
        getSiteContent: async (key) => (savedData[key] as typeof DEFAULT_HERO_CONTENT) || DEFAULT_HERO_CONTENT,
        upsertSiteContent: async (key, payload) => {
          savedData[key] = payload;
        },
        isStoragePathInUse: async () => false,
        ...overrides,
      },
      storage: {
        upload: async (path) => ({ publicUrl: `https://mock-storage.supabase.co/site/${path}` }),
        remove: async () => {},
        getPublicUrl: (path) => `https://mock-storage.supabase.co/site/${path}`,
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

    return { deps, revalidatedPaths, revalidatedTags, savedData };
  }

  describe('1. Penolakan Pengguna Tanpa Autentikasi / Hak Akses Admin', () => {
    it('menolak simpan konten jika user unauthenticated', async () => {
      const { deps } = createMockDeps(null, null);

      await assert.rejects(
        async () => executeSaveHeroContent(DEFAULT_HERO_CONTENT, deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );

      await assert.rejects(
        async () => executeSaveAboutContent(DEFAULT_ABOUT_CONTENT, deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );

      await assert.rejects(
        async () => executeSaveContactContent(DEFAULT_CONTACT_CONTENT, deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );

      await assert.rejects(
        async () => executeSaveSocialContent(DEFAULT_SOCIAL_CONTENT, deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );

      await assert.rejects(
        async () => executeUploadSiteImage(Buffer.from('test'), 'test.jpg', deps),
        /Sesi tidak valid|UNAUTHORIZED|FORBIDDEN/i
      );
    });
  });

  describe('2. Keberhasilan Penyimpanan Konten & Revalidasi Tag oleh Admin', () => {
    const adminUser: RawAuthUser = { id: 'u-admin', email: 'admin@test.com' };
    const adminProfile: RawProfile = { id: 'u-admin', role: 'admin', is_active: true };

    it('executeSaveHeroContent menyimpan payload dan merevalidasi tag site-content-hero', async () => {
      const { deps, revalidatedTags, revalidatedPaths } = createMockDeps(adminUser, adminProfile);

      const res = await executeSaveHeroContent(DEFAULT_HERO_CONTENT, deps);

      assert.strictEqual(res.ok, true);
      assert.ok(revalidatedTags.includes('site-content'));
      assert.ok(revalidatedTags.includes('site-content-hero'));
      assert.ok(revalidatedPaths.includes('/'));
    });

    it('executeSaveAboutContent membersihkan teks sejarah dengan sanitasi dan merevalidasi /tentang-kami', async () => {
      const { deps, revalidatedTags, revalidatedPaths, savedData } = createMockDeps(adminUser, adminProfile);

      const dirtyAbout = {
        ...DEFAULT_ABOUT_CONTENT,
        history: '<p>Sejarah <script>alert(1)</script> bermutu.</p>',
      };

      const res = await executeSaveAboutContent(dirtyAbout, deps);

      assert.strictEqual(res.ok, true);
      const savedAbout = savedData.about as { history: string };
      assert.doesNotMatch(savedAbout.history, /<script/i);
      assert.ok(revalidatedTags.includes('site-content-about'));
      assert.ok(revalidatedPaths.includes('/tentang-kami'));
    });

    it('executeSaveContactContent menyimpan nomor resmi PRD §8 dan merevalidasi /kontak', async () => {
      const { deps, revalidatedTags, revalidatedPaths } = createMockDeps(adminUser, adminProfile);

      const res = await executeSaveContactContent(DEFAULT_CONTACT_CONTENT, deps);

      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.data?.phone, '0813-8060-4256');
      assert.ok(revalidatedTags.includes('site-content-contact'));
      assert.ok(revalidatedPaths.includes('/kontak'));
    });

    it('executeSaveSocialContent menyimpan tautan media sosial dan merevalidasi rute publik', async () => {
      const { deps, revalidatedTags, revalidatedPaths } = createMockDeps(adminUser, adminProfile);

      const res = await executeSaveSocialContent(DEFAULT_SOCIAL_CONTENT, deps);

      assert.strictEqual(res.ok, true);
      assert.ok(revalidatedTags.includes('site-content-social'));
      assert.ok(revalidatedPaths.includes('/'));
    });
  });

  describe('3. Validasi & Keamanan Pengunggahan Gambar (Tahap 5 Parity)', () => {
    const adminUser: RawAuthUser = { id: 'u-admin', email: 'admin@test.com' };
    const adminProfile: RawProfile = { id: 'u-admin', role: 'admin', is_active: true };

    it('menolak pengunggahan berkas yang melebihi batas ukuran 5 MB', async () => {
      const { deps } = createMockDeps(adminUser, adminProfile);
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 10);

      const res = await executeUploadSiteImage(largeBuffer, 'large.jpg', deps);

      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error?.code, 'BAD_REQUEST');
    });

    it('menolak berkas yang bukan gambar asli (magic bytes invalid)', async () => {
      const { deps } = createMockDeps(adminUser, adminProfile);
      const fakeImage = Buffer.from('INI_BUKAN_GAMBAR_TETAPI_TEKS');

      const res = await executeUploadSiteImage(fakeImage, 'fake.jpg', deps);

      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error?.code, 'BAD_REQUEST');
    });

    it('mengunggah gambar asli (valid PNG magic bytes) ke path hero/', async () => {
      const { deps } = createMockDeps(adminUser, adminProfile);

      // PNG valid magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      ]);

      const res = await executeUploadSiteImage(pngBuffer, 'hero.png', deps);

      assert.strictEqual(res.ok, true);
      assert.ok(res.data?.path.startsWith('hero/'));
      assert.ok(res.data?.url.includes('https://mock-storage.supabase.co/site/hero/'));
    });
  });
});

