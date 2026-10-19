import type { Banner } from '../../types/index.ts';
import type { BannerScheduleStatus } from './types.ts';

/**
 * Menghitung status penjadwalan banner berdasarkan waktu saat ini:
 * - 'inactive': toggle is_active = false
 * - 'upcoming': is_active = true namun waktu mulai belum tiba (now < starts_at)
 * - 'expired': is_active = true namun waktu tayang sudah habis (now > ends_at)
 * - 'active_now': is_active = true dan now berada di antara starts_at dan ends_at
 */
export function computeBannerStatus(
  banner: Banner,
  now: Date = new Date()
): BannerScheduleStatus {
  if (!banner.is_active) {
    return 'inactive';
  }
  const startsAt = new Date(banner.starts_at).getTime();
  const endsAt = new Date(banner.ends_at).getTime();
  const currentTime = now.getTime();

  if (currentTime < startsAt) {
    return 'upcoming';
  }
  if (currentTime > endsAt) {
    return 'expired';
  }
  return 'active_now';
}
