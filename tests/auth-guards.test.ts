import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUserProfile,
  validateAdminRole,
  validateSuperAdminRole,
  type AuthenticatedUser,
} from '../src/lib/auth/guards.ts';
import { AuthError } from '../src/lib/action-response.ts';

describe('Server-Side Authorization Gates', () => {
  const dummyUser = { id: 'usr-123', email: 'admin@frasaklausamedia.com' };

  it('menolak user tanpa sesi (anonymous) dengan status 401 UNAUTHORIZED', () => {
    assert.throws(
      () => validateUserProfile(null, null),
      (err: unknown) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 401);
        assert.equal(err.code, 'UNAUTHORIZED');
        return true;
      }
    );
  });

  it('menolak user jika profil basis data tidak ditemukan dengan status 401 UNAUTHORIZED', () => {
    assert.throws(
      () => validateUserProfile(dummyUser, null),
      (err: unknown) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 401);
        assert.equal(err.code, 'UNAUTHORIZED');
        return true;
      }
    );
  });

  it('menolak akun nonaktif (is_active: false) dengan status 403 FORBIDDEN', () => {
    const inactiveProfile = {
      id: 'usr-123',
      full_name: 'Budi Nonaktif',
      avatar_url: null,
      role: 'admin' as const,
      is_active: false,
    };

    assert.throws(
      () => validateUserProfile(dummyUser, inactiveProfile),
      (err: unknown) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        assert.equal(err.code, 'FORBIDDEN');
        assert.match(err.message, /dinonaktifkan/i);
        return true;
      }
    );
  });

  it('mengembalikan data ter-sanitasi untuk akun aktif yang sah', () => {
    const activeProfile = {
      id: 'usr-123',
      full_name: 'Dewi Admin',
      avatar_url: 'https://img.example.com/avatar.jpg',
      role: 'admin' as const,
      is_active: true,
    };

    const sanitized = validateUserProfile(dummyUser, activeProfile);
    assert.deepEqual(sanitized, {
      id: 'usr-123',
      email: 'admin@frasaklausamedia.com',
      fullName: 'Dewi Admin',
      avatarUrl: 'https://img.example.com/avatar.jpg',
      role: 'admin',
      isActive: true,
    });
  });

  it('validateAdminRole meloloskan admin dan super_admin', () => {
    const adminUser: AuthenticatedUser = {
      id: '1',
      email: 'admin@test.com',
      fullName: 'Admin',
      avatarUrl: null,
      role: 'admin',
      isActive: true,
    };

    const superAdminUser: AuthenticatedUser = {
      id: '2',
      email: 'super@test.com',
      fullName: 'Super Admin',
      avatarUrl: null,
      role: 'super_admin',
      isActive: true,
    };

    assert.doesNotThrow(() => validateAdminRole(adminUser));
    assert.doesNotThrow(() => validateAdminRole(superAdminUser));
  });

  it('validateAdminRole menolak role non-admin (misal pengunjung biasa)', () => {
    const regularUser = {
      id: '3',
      email: 'visitor@test.com',
      fullName: 'Visitor',
      avatarUrl: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: 'member' as any,
      isActive: true,
    };

    assert.throws(
      () => validateAdminRole(regularUser),
      (err: unknown) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  it('validateSuperAdminRole hanya meloloskan super_admin dan menolak admin biasa', () => {
    const adminUser: AuthenticatedUser = {
      id: '1',
      email: 'admin@test.com',
      fullName: 'Admin',
      avatarUrl: null,
      role: 'admin',
      isActive: true,
    };

    const superAdminUser: AuthenticatedUser = {
      id: '2',
      email: 'super@test.com',
      fullName: 'Super Admin',
      avatarUrl: null,
      role: 'super_admin',
      isActive: true,
    };

    assert.doesNotThrow(() => validateSuperAdminRole(superAdminUser));

    assert.throws(
      () => validateSuperAdminRole(adminUser),
      (err: unknown) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.status, 403);
        assert.match(err.message, /Super Admin/i);
        return true;
      }
    );
  });
});
