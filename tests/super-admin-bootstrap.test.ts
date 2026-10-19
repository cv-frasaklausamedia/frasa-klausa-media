import test from 'node:test';
import assert from 'node:assert/strict';

type UserRole = 'admin' | 'super_admin';

interface ProfileRecord {
  id: string;
  role: UserRole;
  is_active: boolean;
}

interface TriggerContext {
  authUid: string | null;
  profiles: ProfileRecord[];
}

/**
 * Simulasi logika PL/pgSQL function public.check_profile_privilege_changes()
 */
function simulateCheckProfilePrivilegeChanges(
  ctx: TriggerContext,
  oldRecord: ProfileRecord,
  newRecord: ProfileRecord
): ProfileRecord {
  // Jika role atau is_active diubah:
  if (newRecord.role !== oldRecord.role || newRecord.is_active !== oldRecord.is_active) {
    // 1. Database Admin / SQL Editor / Service Role bypass:
    if (ctx.authUid === null) {
      return newRecord;
    }

    // 2. Bootstrap Mode:
    const hasSuperAdmin = ctx.profiles.some(
      (p) => p.role === 'super_admin' && p.is_active === true
    );

    if (!hasSuperAdmin && newRecord.role === 'super_admin') {
      return newRecord;
    }

    // 3. Request melalui Web / PostgREST API (auth.uid() IS NOT NULL):
    const caller = ctx.profiles.find((p) => p.id === ctx.authUid);
    const callerRole = caller?.role;
    const callerActive = caller?.is_active ?? false;

    if (callerRole !== 'super_admin' || !callerActive) {
      throw new Error(
        'Hanya Super Admin aktif yang berhak mengubah peran (role) atau status aktif pengguna.'
      );
    }

    // User tidak boleh mengubah role miliknya sendiri (mencegah lockout)
    if (ctx.authUid === oldRecord.id && newRecord.role !== oldRecord.role) {
      throw new Error(
        'Super Admin tidak diperbolehkan mengubah role akun miliknya sendiri untuk mencegah penguncian sistem.'
      );
    }
  }

  return newRecord;
}

test('Super Admin Bootstrap & Privilege Changes Trigger Simulation', async (t) => {
  const adminAccount: ProfileRecord = {
    id: 'user-admin-1',
    role: 'admin',
    is_active: true,
  };

  await t.test('1. Eksekusi langsung di SQL Editor / DB Admin (auth.uid() === null) diizinkan mengubah role', () => {
    const ctx: TriggerContext = {
      authUid: null, // Skenario query Supabase SQL Editor
      profiles: [{ ...adminAccount }],
    };

    const updated = simulateCheckProfilePrivilegeChanges(
      ctx,
      adminAccount,
      { ...adminAccount, role: 'super_admin' }
    );

    assert.strictEqual(updated.role, 'super_admin');
  });

  await t.test('2. Bootstrap Mode: Izinkan promosi Super Admin pertama jika belum ada Super Admin di sistem', () => {
    const ctx: TriggerContext = {
      authUid: 'user-admin-1',
      profiles: [{ ...adminAccount }], // Hanya ada role 'admin'
    };

    const updated = simulateCheckProfilePrivilegeChanges(
      ctx,
      adminAccount,
      { ...adminAccount, role: 'super_admin' }
    );

    assert.strictEqual(updated.role, 'super_admin');
  });

  await t.test('3. Menolak eskalasi hak akses oleh Admin biasa saat sudah ada Super Admin aktif', () => {
    const existingSuperAdmin: ProfileRecord = {
      id: 'super-admin-1',
      role: 'super_admin',
      is_active: true,
    };

    const anotherAdmin: ProfileRecord = {
      id: 'user-admin-2',
      role: 'admin',
      is_active: true,
    };

    const ctx: TriggerContext = {
      authUid: 'user-admin-2', // Dipanggil oleh admin biasa
      profiles: [existingSuperAdmin, anotherAdmin],
    };

    assert.throws(
      () => {
        simulateCheckProfilePrivilegeChanges(
          ctx,
          anotherAdmin,
          { ...anotherAdmin, role: 'super_admin' }
        );
      },
      (err: Error) => {
        return err.message.includes(
          'Hanya Super Admin aktif yang berhak mengubah peran (role) atau status aktif pengguna.'
        );
      }
    );
  });

  await t.test('4. Super Admin aktif diizinkan mengubah role dan status aktif akun pengguna lain', () => {
    const activeSuperAdmin: ProfileRecord = {
      id: 'super-admin-1',
      role: 'super_admin',
      is_active: true,
    };

    const targetUser: ProfileRecord = {
      id: 'user-admin-2',
      role: 'admin',
      is_active: true,
    };

    const ctx: TriggerContext = {
      authUid: 'super-admin-1',
      profiles: [activeSuperAdmin, targetUser],
    };

    // Promote target
    const promoted = simulateCheckProfilePrivilegeChanges(
      ctx,
      targetUser,
      { ...targetUser, role: 'super_admin' }
    );
    assert.strictEqual(promoted.role, 'super_admin');

    // Deactivate target
    const deactivated = simulateCheckProfilePrivilegeChanges(
      ctx,
      targetUser,
      { ...targetUser, is_active: false }
    );
    assert.strictEqual(deactivated.is_active, false);
  });

  await t.test('5. Menolak Super Admin yang mencoba mengubah role miliknya sendiri (mencegah lockout)', () => {
    const activeSuperAdmin: ProfileRecord = {
      id: 'super-admin-1',
      role: 'super_admin',
      is_active: true,
    };

    const ctx: TriggerContext = {
      authUid: 'super-admin-1',
      profiles: [activeSuperAdmin],
    };

    assert.throws(
      () => {
        simulateCheckProfilePrivilegeChanges(
          ctx,
          activeSuperAdmin,
          { ...activeSuperAdmin, role: 'admin' }
        );
      },
      (err: Error) => {
        return err.message.includes(
          'Super Admin tidak diperbolehkan mengubah role akun miliknya sendiri untuk mencegah penguncian sistem.'
        );
      }
    );
  });
});
