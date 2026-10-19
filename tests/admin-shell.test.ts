import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminRole, validateSuperAdminRole, type AuthenticatedUser } from '../src/lib/auth/guards.ts';
import { parseSidebarCookie } from '../src/lib/sidebar.ts';

test('Admin Shell Authorization & Navigation Suite', async (t) => {
  const regularAdmin: AuthenticatedUser = {
    id: 'admin-uuid-1',
    email: 'admin@frasaklausamedia.com',
    fullName: 'Editor Admin',
    avatarUrl: null,
    role: 'admin',
    isActive: true,
  };

  const superAdmin: AuthenticatedUser = {
    id: 'super-admin-uuid-2',
    email: 'superadmin@frasaklausamedia.com',
    fullName: 'Super Administrator',
    avatarUrl: null,
    role: 'super_admin',
    isActive: true,
  };

  await t.test('Admin biasa diizinkan oleh validateAdminRole', () => {
    assert.doesNotThrow(() => {
      const result = validateAdminRole(regularAdmin);
      assert.strictEqual(result.role, 'admin');
    });
  });

  await t.test('Admin biasa ditolak dengan status 403 saat mencoba mengakses level Super Admin', () => {
    assert.throws(
      () => {
        validateSuperAdminRole(regularAdmin);
      },
      (err: unknown) => {
        const authErr = err as { status?: number; code?: string };
        return authErr.status === 403 && authErr.code === 'FORBIDDEN';
      }
    );
  });

  await t.test('Super Admin diizinkan baik oleh validateAdminRole maupun validateSuperAdminRole', () => {
    assert.doesNotThrow(() => {
      validateAdminRole(superAdmin);
      validateSuperAdminRole(superAdmin);
    });
  });

  await t.test('Pengujian parseSidebarCookie untuk persistensi sidebar tanpa flash', () => {

    // Skenario 1: Cookie undefined -> true (expanded)
    assert.strictEqual(parseSidebarCookie(undefined), true);

    // Skenario 2: Cookie null -> true (expanded)
    assert.strictEqual(parseSidebarCookie(null), true);

    // Skenario 3: Cookie persis 'false' -> false (collapsed)
    assert.strictEqual(parseSidebarCookie('false'), false);

    // Skenario 4: Cookie 'true' -> true (expanded)
    assert.strictEqual(parseSidebarCookie('true'), true);

    // Skenario 5: Nilai rusak / sembarang / invalid -> true (expanded)
    assert.strictEqual(parseSidebarCookie('invalid'), true);
    assert.strictEqual(parseSidebarCookie(''), true);
  });
});
