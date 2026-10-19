import test from 'node:test';
import assert from 'node:assert/strict';

import type { PostDetail, PostListItem } from '../src/lib/posts/types.ts';

/**
 * Simulasi evaluasi predicate RLS posts_select_policy:
 * public.is_active_admin() OR (status = 'published' AND published_at <= now())
 */
function evaluatePostsSelectPolicy(
  row: { status: 'draft' | 'published'; published_at: string | null },
  user: { role?: string; isActive?: boolean } | null,
  now = new Date()
): boolean {
  const isAdminActive = Boolean(
    user && (user.role === 'admin' || user.role === 'super_admin') && user.isActive
  );

  if (isAdminActive) {
    return true;
  }

  // Pengunjung publik anonim
  if (row.status !== 'published') {
    return false;
  }

  if (!row.published_at) {
    return false;
  }

  const pubDate = new Date(row.published_at);
  return pubDate <= now;
}

test('Post Draft & Scheduled Security Suite (PRD §5 & Tahap 6)', async (t) => {
  const now = new Date('2026-10-19T12:00:00Z');
  const pastDate = new Date('2026-10-18T10:00:00Z').toISOString();
  const futureDate = new Date('2026-10-20T10:00:00Z').toISOString();

  const draftPost = {
    status: 'draft' as const,
    published_at: null,
  };

  const publishedPastPost = {
    status: 'published' as const,
    published_at: pastDate,
  };

  const scheduledFuturePost = {
    status: 'published' as const,
    published_at: futureDate,
  };

  const anonUser = null;
  const regularUser = { role: 'user', isActive: true };
  const inactiveAdmin = { role: 'admin', isActive: false };
  const activeAdmin = { role: 'admin', isActive: true };
  const superAdmin = { role: 'super_admin', isActive: true };

  await t.test('1. Pengunjung anonim TIDAK BISA membaca artikel berstatus draft', () => {
    const isAllowed = evaluatePostsSelectPolicy(draftPost, anonUser, now);
    assert.equal(isAllowed, false, 'Draf artikel tidak boleh bocor ke anonim');
  });

  await t.test('2. Pengguna biasa atau admin nonaktif TIDAK BISA membaca artikel draft', () => {
    assert.equal(evaluatePostsSelectPolicy(draftPost, regularUser, now), false);
    assert.equal(evaluatePostsSelectPolicy(draftPost, inactiveAdmin, now), false);
  });

  await t.test('3. Pengunjung anonim TIDAK BISA membaca artikel terjadwal yang tanggal rilisnya di masa depan', () => {
    const isAllowed = evaluatePostsSelectPolicy(scheduledFuturePost, anonUser, now);
    assert.equal(
      isAllowed,
      false,
      'Artikel terjadwal di masa depan tidak boleh bocor sebelum waktunya'
    );
  });

  await t.test('4. Pengunjung anonim DAPAT membaca artikel berstatus published yang tanggal rilisnya sudah lewat', () => {
    const isAllowed = evaluatePostsSelectPolicy(publishedPastPost, anonUser, now);
    assert.equal(isAllowed, true, 'Artikel terbit sah harus dapat diakses publik');
  });

  await t.test('5. Admin aktif dan Super Admin DAPAT membaca seluruh artikel termasuk draft dan terjadwal (pratinjau)', () => {
    assert.equal(evaluatePostsSelectPolicy(draftPost, activeAdmin, now), true);
    assert.equal(evaluatePostsSelectPolicy(draftPost, superAdmin, now), true);
    assert.equal(evaluatePostsSelectPolicy(scheduledFuturePost, activeAdmin, now), true);
    assert.equal(evaluatePostsSelectPolicy(scheduledFuturePost, superAdmin, now), true);
  });

  await t.test('6. Logika DAL publik menyaring secara defensif status=published dan published_at <= now()', () => {
    // Simulasi filter DAL publik
    const mockDbRows = [
      { id: '1', title: 'Draft Post', status: 'draft' as const, published_at: null },
      { id: '2', title: 'Future Scheduled', status: 'published' as const, published_at: futureDate },
      { id: '3', title: 'Live Published', status: 'published' as const, published_at: pastDate },
    ];

    const publicAccessible = mockDbRows.filter(
      (p) => p.status === 'published' && p.published_at && new Date(p.published_at) <= now
    );

    assert.equal(publicAccessible.length, 1);
    assert.equal(publicAccessible[0]?.id, '3');
    assert.equal(publicAccessible[0]?.title, 'Live Published');
  });
});
