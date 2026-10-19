import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUserProfile,
  validateAdminRole,
  validateSuperAdminRole,
} from '../src/lib/auth/guards.ts';
import {
  handleActionError,
  actionSuccess,
  type ActionResponse,
} from '../src/lib/action-response.ts';

/**
 * Simulasi Server Action Administratif Sensitif (misal: updateBookAction / deletePostAction)
 * yang langsung memanggil authorization gate di baris pertama eksekusinya.
 */
async function simulatedAdminAction(
  user: { id: string; email?: string | null } | null,
  profile: { id: string; full_name: string; avatar_url: string | null; role: 'admin' | 'super_admin'; is_active: boolean } | null,
  _payload?: { title: string }
): Promise<ActionResponse<{ updated: boolean }>> {
  void _payload;
  try {
    // 1. Authorization check wajib di server (bukan mengandalkan route atau UI)
    const authUser = validateUserProfile(user, profile);
    validateAdminRole(authUser);

    // 2. Operasi bisnis admin yang sah
    return actionSuccess({ updated: true });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Simulasi Server Action Super Admin Sensitif (misal: createNewAdminAction)
 */
async function simulatedSuperAdminAction(
  user: { id: string; email?: string | null } | null,
  profile: { id: string; full_name: string; avatar_url: string | null; role: 'admin' | 'super_admin'; is_active: boolean } | null
): Promise<ActionResponse<{ createdAdmin: boolean }>> {
  try {
    const authUser = validateUserProfile(user, profile);
    validateSuperAdminRole(authUser);

    return actionSuccess({ createdAdmin: true });
  } catch (error) {
    return handleActionError(error);
  }
}

describe('DoD Direct Action Call Verification (Direct Action Invocation Without UI)', () => {
  it('DoD 1: Pengguna anonim (tanpa sesi) memanggil Server Action admin langsung ditolak (status 401)', async () => {
    // Memanggil action secara langsung tanpa sesi login (user: null, profile: null)
    const response = await simulatedAdminAction(null, null, { title: 'Ubah Judul Buku' });

    assert.equal(response.ok, false);
    assert.equal(response.error.status, 401);
    assert.equal(response.error.code, 'UNAUTHORIZED');
    assert.match(response.error.message, /sesi tidak valid/i);
  });

  it('DoD 2: Admin berstatus nonaktif (is_active: false) memanggil Server Action ditolak secara tegas (status 403)', async () => {
    const inactiveUser = { id: 'usr-inactive', email: 'nonaktif@frasaklausamedia.com' };
    const inactiveProfile = {
      id: 'usr-inactive',
      full_name: 'Admin Diberhentikan',
      avatar_url: null,
      role: 'admin' as const,
      is_active: false,
    };

    const response = await simulatedAdminAction(inactiveUser, inactiveProfile, { title: 'Coba Mutasi' });

    assert.equal(response.ok, false);
    assert.equal(response.error.status, 403);
    assert.equal(response.error.code, 'FORBIDDEN');
    assert.match(response.error.message, /dinonaktifkan/i);
  });

  it('DoD 3: Admin biasa memanggil action khusus Super Admin langsung ditolak (status 403)', async () => {
    const activeAdminUser = { id: 'usr-admin', email: 'admin@frasaklausamedia.com' };
    const activeAdminProfile = {
      id: 'usr-admin',
      full_name: 'Admin Biasa',
      avatar_url: null,
      role: 'admin' as const,
      is_active: true,
    };

    const response = await simulatedSuperAdminAction(activeAdminUser, activeAdminProfile);

    assert.equal(response.ok, false);
    assert.equal(response.error.status, 403);
    assert.equal(response.error.code, 'FORBIDDEN');
    assert.match(response.error.message, /Super Admin/i);
  });

  it('DoD 4: Admin aktif yang sah berhasil mengeksekusi Server Action dengan sukses', async () => {
    const validAdminUser = { id: 'usr-valid', email: 'admin@frasaklausamedia.com' };
    const validAdminProfile = {
      id: 'usr-valid',
      full_name: 'Admin Sah',
      avatar_url: null,
      role: 'admin' as const,
      is_active: true,
    };

    const response = await simulatedAdminAction(validAdminUser, validAdminProfile, { title: 'Buku Valid' });

    assert.equal(response.ok, true);
    assert.deepEqual(response.data, { updated: true });
  });
});
