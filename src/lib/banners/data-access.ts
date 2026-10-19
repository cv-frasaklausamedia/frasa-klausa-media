import { unstable_cache } from '../cache.ts';
import { createClient } from '../supabase/server.ts';
import type { Banner } from '../../types/index.ts';
import type { BannerFormValues, BannerQueryParams } from '../../validations/banner.ts';
import type {
  BannerListResponse,
  BannerWithComputedStatus,
} from './types.ts';

import { computeBannerStatus } from './status.ts';
export { computeBannerStatus };

/**
 * Mengambil daftar banner untuk tabel Admin CMS dengan filter status, pencarian, dan paginasi.
 */
export async function getBannersList(
  params: BannerQueryParams
): Promise<BannerListResponse> {
  const supabase = await createClient();
  const { page, pageSize, search, status } = params;

  // Ambil seluruh banner yang sesuai pencarian untuk menghitung metrik status dan paginasi
  let query = supabase
    .from('banners')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search && search.trim() !== '') {
    query = query.ilike('message', `%${search.trim()}%`);
  }

  const { data: rawBanners, error } = await query;

  if (error) {
    console.error('[getBannersList] Supabase error:', error);
    throw new Error(`Gagal memuat daftar banner: ${error.message}`);
  }

  const allBanners = (rawBanners || []) as Banner[];
  const now = new Date();

  // Hitung status komputasi untuk setiap banner
  const bannersWithStatus: BannerWithComputedStatus[] = allBanners.map((b) => ({
    ...b,
    scheduleStatus: computeBannerStatus(b, now),
  }));

  // Hitung ringkasan jumlah status
  const counts = {
    all: bannersWithStatus.length,
    active_now: bannersWithStatus.filter((b) => b.scheduleStatus === 'active_now').length,
    upcoming: bannersWithStatus.filter((b) => b.scheduleStatus === 'upcoming').length,
    expired: bannersWithStatus.filter((b) => b.scheduleStatus === 'expired').length,
    inactive: bannersWithStatus.filter((b) => b.scheduleStatus === 'inactive').length,
  };

  // Terapkan filter status jika dipilih
  let filtered = bannersWithStatus;
  if (status && status !== 'all') {
    filtered = bannersWithStatus.filter((b) => b.scheduleStatus === status);
  }

  // Paginasi di memori dari hasil filter
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const validPage = Math.min(Math.max(1, page), totalPages);
  const from = (validPage - 1) * pageSize;
  const to = from + pageSize;
  const paginatedData = filtered.slice(from, to);

  return {
    data: paginatedData,
    meta: {
      page: validPage,
      pageSize,
      total,
      totalPages,
      counts,
    },
  };
}

/**
 * Mengambil record banner tunggal berdasarkan ID
 */
export async function getBannerById(id: string): Promise<Banner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getBannerById] Error:', error);
    throw new Error(`Gagal memuat banner: ${error.message}`);
  }

  return (data as Banner) || null;
}

/**
 * Menyimpan banner baru ke database
 */
export async function createBannerRecord(data: BannerFormValues): Promise<Banner> {
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from('banners')
    .insert({
      message: data.message,
      link_url: data.link_url || null,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      is_active: data.is_active,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[createBannerRecord] Insert error:', error);
    throw new Error(`Gagal membuat banner: ${error.message}`);
  }

  return created as Banner;
}

/**
 * Memperbarui record banner
 */
export async function updateBannerRecord(
  id: string,
  data: BannerFormValues
): Promise<Banner> {
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from('banners')
    .update({
      message: data.message,
      link_url: data.link_url || null,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      is_active: data.is_active,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[updateBannerRecord] Update error:', error);
    throw new Error(`Gagal memperbarui banner: ${error.message}`);
  }

  return updated as Banner;
}

/**
 * Menghapus record banner
 */
export async function deleteBannerRecord(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);

  if (error) {
    console.error('[deleteBannerRecord] Delete error:', error);
    throw new Error(`Gagal menghapus banner: ${error.message}`);
  }
}

/**
 * Mengubah status aktif banner (sakelar cepat dari tabel)
 */
export async function toggleBannerActiveRecord(
  id: string,
  isActive: boolean
): Promise<Banner> {
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from('banners')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[toggleBannerActiveRecord] Toggle error:', error);
    throw new Error(`Gagal mengubah status aktif banner: ${error.message}`);
  }

  return updated as Banner;
}

/**
 * Mengambil banner aktif langsung dari database PostgreSQL:
 * - is_active = true
 * - starts_at <= now()
 * - ends_at >= now()
 *
 * Aturan Prioritas:
 * 1. starts_at DESC (banner yang waktu mulainya paling akhir / terkini dijadwalkan)
 * 2. created_at DESC (banner yang dibuat paling baru bila waktu mulai sama)
 * Limit: 1 record
 */
export async function getActiveBannerFromDb(nowIso: string): Promise<Banner | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('banners')
    .select('id, message, link_url, starts_at, ends_at, is_active, created_at, updated_at')
    .eq('is_active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('starts_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getActiveBannerFromDb] Query error:', error);
    return null;
  }

  return (data as Banner) || null;
}

export const BANNER_CACHE_TAG = 'active-banner';
export const BANNERS_TAG = 'banners';

/**
 * Mengambil banner aktif tanpa cache (cocok untuk pengujian atau inspeksi DB langsung)
 */
export async function getActiveBannerUncached(nowIso?: string): Promise<Banner | null> {
  const currentIso = nowIso || new Date().toISOString();
  return await getActiveBannerFromDb(currentIso);
}

/**
 * Server Util getActiveBanner():
 * - Mengembalikan banner promosi dengan is_active = true dan now() di antara starts_at - ends_at.
 * - Aturan Prioritas:
 *   1. starts_at DESC (jadwal mulai paling baru / terkini diprioritaskan).
 *   2. created_at DESC (dibuat paling baru bila jadwal mulai identik).
 * - Strategi Cache:
 *   - Dibungkus unstable_cache dengan TTL 60 detik dan tag 'active-banner'.
 *   - Trade-off: Setiap perubahan admin langsung menginvalidasi tag secara instan (on-demand),
 *     sedangkan perubahan otomatis berbasis waktu (jadwal mulai/selesai tayang) akan berpindah
 *     dalam waktu maksimal 60 detik tanpa intervensi manual tim admin, sekaligus melindungi
 *     database Supabase dari lonjakan query per-request pada setiap kunjungan publik.
 */
export const getActiveBanner = unstable_cache(
  async (): Promise<Banner | null> => {
    return await getActiveBannerUncached();
  },
  ['active-banner'],
  {
    revalidate: 60,
    tags: [BANNERS_TAG, BANNER_CACHE_TAG],
  }
);

