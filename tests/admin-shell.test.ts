import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminRole, validateSuperAdminRole, type AuthenticatedUser } from '../src/lib/auth/guards.ts';

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

  await t.test('Simulasi pembacaan cookie sidebar_state di SSR layout', () => {
    // Skenario 1: Cookie tidak ada -> defaultOpen = true (expanded)
    const emptyCookie = undefined;
    const defaultOpen1 = emptyCookie ? emptyCookie === 'true' : true;
    assert.strictEqual(defaultOpen1, true);

    // Skenario 2: Cookie diset 'false' (collapsed) -> defaultOpen = false (collapsed)
    const collapsedCookie = { value: 'false' };
    const defaultOpen2 = collapsedCookie ? collapsedCookie.value === 'true' : true;
    assert.strictEqual(defaultOpen2, false);

    // Skenario 3: Cookie diset 'true' (expanded) -> defaultOpen = true
    const expandedCookie = { value: 'true' };
    const defaultOpen3 = expandedCookie ? expandedCookie.value === 'true' : true;
    assert.strictEqual(defaultOpen3, true);
  });
});
