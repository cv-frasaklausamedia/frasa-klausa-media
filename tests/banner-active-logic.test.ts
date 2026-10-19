import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeBannerStatus } from '../src/lib/banners/status.ts';
import type { Banner } from '../src/types';

describe('Banner Active Logic & Schedule Boundaries Suite (Tahap 7 - PRD §6.2.B)', () => {
  const referenceTime = new Date('2026-10-25T12:00:00.000Z'); // Waktu uji acuan

  const createDummyBanner = (overrides: Partial<Banner>): Banner => ({
    id: 'banner-1',
    message: 'Promo Literasi',
    link_url: '/katalog',
    starts_at: '2026-10-20T00:00:00.000Z',
    ends_at: '2026-10-30T23:59:59.000Z',
    is_active: true,
    created_at: '2026-10-19T00:00:00.000Z',
    updated_at: '2026-10-19T00:00:00.000Z',
    ...overrides,
  });

  describe('1. Evaluasi Status Berdasarkan Batas Waktu (Schedule Boundaries)', () => {
    it('mengidentifikasi banner sebagai "upcoming" jika waktu mulai belum tiba (now < starts_at)', () => {
      const banner = createDummyBanner({
        starts_at: '2026-10-26T00:00:00.000Z', // Besok
        ends_at: '2026-10-30T00:00:00.000Z',
        is_active: true,
      });

      const status = computeBannerStatus(banner, referenceTime);
      assert.strictEqual(status, 'upcoming');
    });

    it('mengidentifikasi banner sebagai "expired" jika waktu selesai sudah lewat (now > ends_at)', () => {
      const banner = createDummyBanner({
        starts_at: '2026-10-10T00:00:00.000Z',
        ends_at: '2026-10-24T23:59:59.000Z', // Kemarin
        is_active: true,
      });

      const status = computeBannerStatus(banner, referenceTime);
      assert.strictEqual(status, 'expired');
    });

    it('mengidentifikasi banner sebagai "active_now" jika now berada di antara starts_at dan ends_at', () => {
      const banner = createDummyBanner({
        starts_at: '2026-10-20T00:00:00.000Z',
        ends_at: '2026-10-30T00:00:00.000Z',
        is_active: true,
      });

      const status = computeBannerStatus(banner, referenceTime);
      assert.strictEqual(status, 'active_now');
    });

    it('mengidentifikasi banner sebagai "active_now" tepat pada batas milidetik awal starts_at', () => {
      const exactStart = new Date('2026-10-25T12:00:00.000Z');
      const banner = createDummyBanner({
        starts_at: exactStart.toISOString(),
        ends_at: '2026-10-28T00:00:00.000Z',
        is_active: true,
      });

      const status = computeBannerStatus(banner, exactStart);
      assert.strictEqual(status, 'active_now');
    });

    it('mengidentifikasi banner sebagai "active_now" tepat pada batas milidetik akhir ends_at', () => {
      const exactEnd = new Date('2026-10-25T12:00:00.000Z');
      const banner = createDummyBanner({
        starts_at: '2026-10-20T00:00:00.000Z',
        ends_at: exactEnd.toISOString(),
        is_active: true,
      });

      const status = computeBannerStatus(banner, exactEnd);
      assert.strictEqual(status, 'active_now');
    });

    it('mengidentifikasi banner sebagai "inactive" jika toggle is_active = false meskipun jadwal sedang aktif', () => {
      const banner = createDummyBanner({
        starts_at: '2026-10-20T00:00:00.000Z',
        ends_at: '2026-10-30T00:00:00.000Z',
        is_active: false, // Dimatikan manual oleh admin
      });

      const status = computeBannerStatus(banner, referenceTime);
      assert.strictEqual(status, 'inactive');
    });
  });

  describe('2. Aturan Prioritas Banner Aktif Berkelompok (Overlapping Priority Rules)', () => {
    /**
     * Simulasi query filter dan sortir prioritas:
     * - is_active = true
     * - starts_at <= now AND ends_at >= now
     * - SORT: starts_at DESC, created_at DESC
     * - LIMIT 1
     */
    function resolveActiveBanner(banners: Banner[], now: Date): Banner | null {
      const activeCandidates = banners.filter((b) => {
        if (!b.is_active) return false;
        const start = new Date(b.starts_at).getTime();
        const end = new Date(b.ends_at).getTime();
        const cur = now.getTime();
        return cur >= start && cur <= end;
      });

      if (activeCandidates.length === 0) return null;

      // Sortir berdasarkan aturan prioritas PRD §6.2.B
      activeCandidates.sort((a, b) => {
        const startDiff = new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
        if (startDiff !== 0) return startDiff; // starts_at DESC
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // created_at DESC
      });

      return activeCandidates[0];
    }

    it('memilih banner dengan jadwal mulai (starts_at) paling akhir jika beberapa banner aktif bersamaan', () => {
      const bannerA = createDummyBanner({
        id: 'banner-a',
        message: 'Promo Bulanan',
        starts_at: '2026-10-01T00:00:00.000Z',
        ends_at: '2026-10-31T23:59:59.000Z',
        created_at: '2026-09-30T00:00:00.000Z',
        is_active: true,
      });

      const bannerB = createDummyBanner({
        id: 'banner-b',
        message: 'Flash Sale Akhir Pekan',
        starts_at: '2026-10-24T00:00:00.000Z', // Lebih baru dijadwalkan
        ends_at: '2026-10-26T23:59:59.000Z',
        created_at: '2026-10-22T00:00:00.000Z',
        is_active: true,
      });

      const chosen = resolveActiveBanner([bannerA, bannerB], referenceTime);
      assert.ok(chosen);
      assert.strictEqual(chosen.id, 'banner-b', 'Banner B (Flash Sale) harus diprioritaskan');
    });

    it('memilih banner dengan created_at paling baru jika starts_at identik', () => {
      const bannerX = createDummyBanner({
        id: 'banner-x',
        message: 'Promo Reguler',
        starts_at: '2026-10-20T00:00:00.000Z',
        ends_at: '2026-10-30T00:00:00.000Z',
        created_at: '2026-10-18T10:00:00.000Z',
        is_active: true,
      });

      const bannerY = createDummyBanner({
        id: 'banner-y',
        message: 'Promo Revisi Mendesak',
        starts_at: '2026-10-20T00:00:00.000Z', // Waktu mulai sama
        ends_at: '2026-10-30T00:00:00.000Z',
        created_at: '2026-10-19T15:00:00.000Z', // Dibuat lebih baru
        is_active: true,
      });

      const chosen = resolveActiveBanner([bannerX, bannerY], referenceTime);
      assert.ok(chosen);
      assert.strictEqual(chosen.id, 'banner-y', 'Banner Y yang dibuat lebih baru harus diprioritaskan');
    });

    it('mengembalikan null jika seluruh banner dalam database sudah kedaluwarsa atau nonaktif', () => {
      const expiredBanner = createDummyBanner({
        starts_at: '2026-10-01T00:00:00.000Z',
        ends_at: '2026-10-10T00:00:00.000Z',
        is_active: true,
      });

      const inactiveBanner = createDummyBanner({
        starts_at: '2026-10-20T00:00:00.000Z',
        ends_at: '2026-10-30T00:00:00.000Z',
        is_active: false,
      });

      const chosen = resolveActiveBanner([expiredBanner, inactiveBanner], referenceTime);
      assert.strictEqual(chosen, null);
    });
  });
});
