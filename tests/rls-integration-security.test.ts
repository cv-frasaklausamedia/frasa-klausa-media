import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Simulasi Row Level Security (RLS) Engine
 * Berdasarkan kontrak SQL:
 * - src/migrations/003_rls_and_storage.sql
 * - src/migrations/009_accounts_settings_and_audit_logs.sql
 *
 * Menerapkan evaluasi persis aturan RLS Postgres:
 * 1. is_active_admin(): auth.uid() != null && profile.role IN ('admin', 'super_admin') && profile.is_active = true
 * 2. is_super_admin(): auth.uid() != null && profile.role = 'super_admin' && profile.is_active = true
 */

export interface TestUserSession {
  userId: string | null;
  role: 'anon' | 'admin' | 'super_admin';
  isActive: boolean;
}

export interface PostRow {
  id: string;
  title: string;
  status: 'draft' | 'published';
  published_at: string | null;
}

export interface BookRow {
  id: string;
  title: string;
  is_published: boolean;
}

export interface BannerRow {
  id: string;
  message: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

export interface ContactInquiryRow {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
}

export interface ProfileRow {
  id: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
}

export interface AuditLogRow {
  id: string;
  action: string;
  actor_id: string;
}

export interface SystemSettingsRow {
  id: string;
  site_title: string;
  whatsapp_number: string;
}

export class RlsDatabaseEmulator {
  private posts: PostRow[] = [];
  private books: BookRow[] = [];
  private banners: BannerRow[] = [];
  private contactInquiries: ContactInquiryRow[] = [];
  private profiles: ProfileRow[] = [];
  private auditLogs: AuditLogRow[] = [];
  private settings: SystemSettingsRow = {
    id: 'default',
    site_title: 'Frasa Klausa Media',
    whatsapp_number: '6281234567890',
  };

  constructor() {
    this.seed();
  }

  private seed() {
    this.profiles = [
      { id: 'sa-1', full_name: 'Super Admin', role: 'super_admin', is_active: true },
      { id: 'adm-1', full_name: 'Regular Admin', role: 'admin', is_active: true },
      { id: 'inact-1', full_name: 'Inactive Admin', role: 'admin', is_active: false },
    ];

    this.posts = [
      { id: 'p-pub', title: 'Artikel Rilis 2026', status: 'published', published_at: '2026-10-01T00:00:00Z' },
      { id: 'p-draft', title: 'Draf Naskah Rahasia', status: 'draft', published_at: null },
      { id: 'p-future', title: 'Artikel Jadwal Depan', status: 'published', published_at: '2026-11-01T00:00:00Z' },
    ];

    this.books = [
      { id: 'b-pub', title: 'Buku Bestseller', is_published: true },
      { id: 'b-draft', title: 'Buku Masih Ditulis', is_published: false },
    ];

    this.banners = [
      {
        id: 'ban-active',
        message: 'Promo Hari Ini',
        is_active: true,
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-31T23:59:59Z',
      },
      {
        id: 'ban-inactive',
        message: 'Promo Dimatikan',
        is_active: false,
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-31T23:59:59Z',
      },
    ];

    this.contactInquiries = [
      { id: 'inq-1', name: 'Penulis A', email: 'penulis@mail.com', message: 'Tawaran naskah', status: 'unread' },
    ];

    this.auditLogs = [
      { id: 'log-1', action: 'CREATE_BOOK', actor_id: 'adm-1' },
      { id: 'log-2', action: 'DEACTIVATE_USER', actor_id: 'sa-1' },
    ];
  }

  private isActiveAdmin(session: TestUserSession): boolean {
    return Boolean(
      session.userId &&
      (session.role === 'admin' || session.role === 'super_admin') &&
      session.isActive
    );
  }

  private isSuperAdmin(session: TestUserSession): boolean {
    return Boolean(
      session.userId &&
      session.role === 'super_admin' &&
      session.isActive
    );
  }

  // 1. POSTS RLS (SELECT & MUTATION)
  selectPosts(session: TestUserSession, now = new Date('2026-10-20T10:00:00Z')): PostRow[] {
    const isAdmin = this.isActiveAdmin(session);
    return this.posts.filter((post) => {
      if (isAdmin) return true;
      if (post.status !== 'published') return false;
      if (!post.published_at) return false;
      return new Date(post.published_at) <= now;
    });
  }

  insertPost(session: TestUserSession, newPost: PostRow): { ok: boolean; error?: string } {
    if (!this.isActiveAdmin(session)) {
      return { ok: false, error: 'new row violates row-level security policy for table "posts"' };
    }
    this.posts.push(newPost);
    return { ok: true };
  }

  // 2. BOOKS RLS (SELECT & MUTATION)
  selectBooks(session: TestUserSession): BookRow[] {
    const isAdmin = this.isActiveAdmin(session);
    return this.books.filter((b) => isAdmin || b.is_published);
  }

  // 3. CONTACT INQUIRIES RLS (SELECT & INSERT)
  selectContactInquiries(session: TestUserSession): ContactInquiryRow[] {
    if (!this.isActiveAdmin(session)) {
      return []; // RLS policy "contact_inquiries_select_policy": USING (public.is_active_admin())
    }
    return [...this.contactInquiries];
  }

  insertContactInquiry(session: TestUserSession, inquiry: Omit<ContactInquiryRow, 'id'>): { ok: boolean; id: string } {
    // RLS policy: FOR INSERT TO public WITH CHECK (true) -> Anon boleh insert pesan kontak
    const newId = `inq-${Date.now()}`;
    this.contactInquiries.push({ id: newId, ...inquiry });
    return { ok: true, id: newId };
  }

  deleteContactInquiry(session: TestUserSession, inquiryId: string): { ok: boolean; error?: string } {
    if (!this.isActiveAdmin(session)) {
      return { ok: false, error: 'permission denied for table contact_inquiries' };
    }
    this.contactInquiries = this.contactInquiries.filter((i) => i.id !== inquiryId);
    return { ok: true };
  }

  // 4. PROFILES RLS
  selectProfiles(session: TestUserSession): ProfileRow[] {
    // USING (public.is_active_admin() OR id = auth.uid())
    if (this.isActiveAdmin(session)) {
      return [...this.profiles];
    }
    if (session.userId) {
      return this.profiles.filter((p) => p.id === session.userId);
    }
    return [];
  }

  insertProfile(session: TestUserSession, newProfile: ProfileRow): { ok: boolean; error?: string } {
    // WITH CHECK (public.is_super_admin())
    if (!this.isSuperAdmin(session)) {
      return { ok: false, error: 'new row violates row-level security policy for table "profiles"' };
    }
    this.profiles.push(newProfile);
    return { ok: true };
  }

  updateProfileRoleOrStatus(
    session: TestUserSession,
    targetUserId: string,
    updates: Partial<Pick<ProfileRow, 'role' | 'is_active'>>
  ): { ok: boolean; error?: string } {
    if (!this.isSuperAdmin(session)) {
      return { ok: false, error: 'permission denied: only super_admin can modify admin accounts' };
    }
    const idx = this.profiles.findIndex((p) => p.id === targetUserId);
    if (idx === -1) return { ok: false, error: 'User not found' };
    this.profiles[idx] = { ...this.profiles[idx], ...updates };
    return { ok: true };
  }

  // 5. AUDIT LOGS RLS
  selectAuditLogs(session: TestUserSession): AuditLogRow[] {
    // USING (public.is_super_admin())
    if (!this.isSuperAdmin(session)) {
      return [];
    }
    return [...this.auditLogs];
  }

  // 6. SYSTEM SETTINGS RLS
  updateSystemSettings(session: TestUserSession, newSettings: Partial<SystemSettingsRow>): { ok: boolean; error?: string } {
    // USING (public.is_super_admin())
    if (!this.isSuperAdmin(session)) {
      return { ok: false, error: 'permission denied for table system_settings' };
    }
    this.settings = { ...this.settings, ...newSettings };
    return { ok: true };
  }
}

describe('Integrasi Database & RLS Security Suite (PRD §17 & §14)', () => {
  const anonSession: TestUserSession = {
    userId: null,
    role: 'anon',
    isActive: false,
  };

  const adminSession: TestUserSession = {
    userId: 'adm-1',
    role: 'admin',
    isActive: true,
  };

  const inactiveAdminSession: TestUserSession = {
    userId: 'inact-1',
    role: 'admin',
    isActive: false,
  };

  const superAdminSession: TestUserSession = {
    userId: 'sa-1',
    role: 'super_admin',
    isActive: true,
  };

  // ==========================================================================
  // 1. PENGUJIAN PERAN ANON (PENGUNJUNG PUBLIK)
  // ==========================================================================
  describe('Peran Anonim (anon)', () => {
    it('anon TIDAK BISA melihat draft artikel atau artikel masa depan', () => {
      const db = new RlsDatabaseEmulator();
      const posts = db.selectPosts(anonSession);

      assert.strictEqual(posts.length, 1);
      assert.strictEqual(posts[0].id, 'p-pub');
      assert.strictEqual(posts.some((p) => p.status === 'draft'), false);
      assert.strictEqual(posts.some((p) => p.id === 'p-future'), false);
    });

    it('anon TIDAK BISA melihat buku yang belum di-publish (draft buku)', () => {
      const db = new RlsDatabaseEmulator();
      const books = db.selectBooks(anonSession);

      assert.strictEqual(books.length, 1);
      assert.strictEqual(books[0].id, 'b-pub');
      assert.strictEqual(books.some((b) => !b.is_published), false);
    });

    it('anon TIDAK BISA melihat inbox pesan kontak (contact_inquiries)', () => {
      const db = new RlsDatabaseEmulator();
      const inquiries = db.selectContactInquiries(anonSession);
      assert.strictEqual(inquiries.length, 0);
    });

    it('anon TIDAK BISA melihat daftar profil pengguna CMS', () => {
      const db = new RlsDatabaseEmulator();
      const profiles = db.selectProfiles(anonSession);
      assert.strictEqual(profiles.length, 0);
    });

    it('anon TIDAK BISA membaca audit logs sistem', () => {
      const db = new RlsDatabaseEmulator();
      const logs = db.selectAuditLogs(anonSession);
      assert.strictEqual(logs.length, 0);
    });

    it('anon HANYA BISA mengirim (INSERT) pesan formulir kontak', () => {
      const db = new RlsDatabaseEmulator();
      const result = db.insertContactInquiry(anonSession, {
        name: 'Pengunjung Baru',
        email: 'pengunjung@gmail.com',
        message: 'Apakah ada diskon pembelian buku dalam jumlah banyak?',
        status: 'unread',
      });

      assert.strictEqual(result.ok, true);
      assert.ok(result.id);
    });

    it('anon DITOLAK saat mencoba menghapus pesan kontak', () => {
      const db = new RlsDatabaseEmulator();
      const result = db.deleteContactInquiry(anonSession, 'inq-1');
      assert.strictEqual(result.ok, false);
      assert.match(result.error ?? '', /permission denied/i);
    });
  });

  // ==========================================================================
  // 2. PENGUJIAN PERAN ADMIN BIASA (admin)
  // ==========================================================================
  describe('Peran Admin Biasa (admin)', () => {
    it('admin aktif BISA melihat draft artikel dan seluruh buku', () => {
      const db = new RlsDatabaseEmulator();
      const posts = db.selectPosts(adminSession);
      assert.strictEqual(posts.length, 3); // Termasuk draf dan jadwal depan

      const books = db.selectBooks(adminSession);
      assert.strictEqual(books.length, 2); // Termasuk draf buku
    });

    it('admin aktif BISA membaca inbox pesan kontak publik', () => {
      const db = new RlsDatabaseEmulator();
      const inquiries = db.selectContactInquiries(adminSession);
      assert.strictEqual(inquiries.length, 1);
      assert.strictEqual(inquiries[0].id, 'inq-1');
    });

    it('admin biasa DITOLAK saat mencoba mengundang akun admin baru', () => {
      const db = new RlsDatabaseEmulator();
      const result = db.insertProfile(adminSession, {
        id: 'new-adm',
        full_name: 'Penyusup',
        role: 'admin',
        is_active: true,
      });

      assert.strictEqual(result.ok, false);
      assert.match(result.error ?? '', /row-level security policy/i);
    });

    it('admin biasa DITOLAK saat mencoba menonaktifkan akun admin lain', () => {
      const db = new RlsDatabaseEmulator();
      const result = db.updateProfileRoleOrStatus(adminSession, 'inact-1', { is_active: true });
      assert.strictEqual(result.ok, false);
      assert.match(result.error ?? '', /only super_admin/i);
    });

    it('admin biasa DITOLAK saat mencoba mengakses audit logs', () => {
      const db = new RlsDatabaseEmulator();
      const logs = db.selectAuditLogs(adminSession);
      assert.strictEqual(logs.length, 0);
    });

    it('admin biasa DITOLAK saat mencoba memperbarui konfigurasi sistem', () => {
      const db = new RlsDatabaseEmulator();
      const result = db.updateSystemSettings(adminSession, { site_title: 'Hacked Title' });
      assert.strictEqual(result.ok, false);
      assert.match(result.error ?? '', /permission denied/i);
    });
  });

  // ==========================================================================
  // 3. PENGUJIAN PERAN ADMIN NONAKTIF (inactive admin)
  // ==========================================================================
  describe('Peran Admin Nonaktif (is_active: false)', () => {
    it('admin nonaktif DITOLAK dari membaca draf post dan buku', () => {
      const db = new RlsDatabaseEmulator();
      const posts = db.selectPosts(inactiveAdminSession);
      assert.strictEqual(posts.length, 1); // Hanya post terbit publik

      const books = db.selectBooks(inactiveAdminSession);
      assert.strictEqual(books.length, 1); // Hanya buku terbit publik
    });

    it('admin nonaktif DITOLAK dari membaca inbox pesan kontak', () => {
      const db = new RlsDatabaseEmulator();
      const inquiries = db.selectContactInquiries(inactiveAdminSession);
      assert.strictEqual(inquiries.length, 0);
    });

    it('admin nonaktif DITOLAK saat mencoba menambah post baru', () => {
      const db = new RlsDatabaseEmulator();
      const result = db.insertPost(inactiveAdminSession, {
        id: 'p-inact',
        title: 'Post Ilegal',
        status: 'published',
        published_at: '2026-10-20T00:00:00Z',
      });
      assert.strictEqual(result.ok, false);
      assert.match(result.error ?? '', /row-level security policy/i);
    });
  });

  // ==========================================================================
  // 4. PENGUJIAN PERAN SUPER ADMIN (super_admin)
  // ==========================================================================
  describe('Peran Super Admin (super_admin)', () => {
    it('super admin BISA mengundang admin baru dan menonaktifkan akun', () => {
      const db = new RlsDatabaseEmulator();
      const inviteResult = db.insertProfile(superAdminSession, {
        id: 'adm-2',
        full_name: 'Admin Baru',
        role: 'admin',
        is_active: true,
      });
      assert.strictEqual(inviteResult.ok, true);

      const toggleResult = db.updateProfileRoleOrStatus(superAdminSession, 'adm-2', { is_active: false });
      assert.strictEqual(toggleResult.ok, true);
    });

    it('super admin BISA membaca audit logs dan memperbarui pengaturan sistem', () => {
      const db = new RlsDatabaseEmulator();
      const logs = db.selectAuditLogs(superAdminSession);
      assert.strictEqual(logs.length, 2);

      const updateResult = db.updateSystemSettings(superAdminSession, {
        site_title: 'Frasa Klausa Media Official',
      });
      assert.strictEqual(updateResult.ok, true);
    });
  });
});
