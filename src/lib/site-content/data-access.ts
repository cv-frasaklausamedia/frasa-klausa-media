import { unstable_cache } from '../cache.ts';
import { createClient, createPublicClient } from '../supabase/server.ts';
import type { SiteContentKey, SiteContentPayloadMap } from './types.ts';
import { DEFAULT_SITE_CONTENT_MAP } from './defaults.ts';

/**
 * Mengambil record konten situs dari database.
 * Jika record belum ada atau kosong di basis data, otomatis menggabungkan
 * dan mengembalikan fallback konten default resmi (PRD §8) agar halaman publik
 * tidak pernah kosong atau rusak.
 */
export async function getSiteContentRecord<K extends SiteContentKey>(
  key: K
): Promise<SiteContentPayloadMap[K]> {
  const fallback = DEFAULT_SITE_CONTENT_MAP[key];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('site_content')
      .select('payload')
      .eq('key', key)
      .maybeSingle();

    if (error || !data || !data.payload) {
      return fallback;
    }

    const payload = data.payload as unknown as Record<string, unknown>;

    // Lakukan shallow merge dengan fallback agar properti baru tetap memiliki nilai default
    return {
      ...fallback,
      ...payload,
    } as SiteContentPayloadMap[K];
  } catch (err) {
    console.error(`[getSiteContentRecord] Gagal mengambil konten untuk key '${key}':`, err);
    return fallback;
  }
}

/**
 * Menyimpan / memperbarui payload konten situs berdasarkan key unik (hero, about, contact, social)
 */
export async function upsertSiteContentRecord<K extends SiteContentKey>(
  key: K,
  payload: SiteContentPayloadMap[K]
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('site_content').upsert(
    {
      key,
      payload: payload as unknown as import('../../types/database.ts').Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) {
    console.error(`[upsertSiteContentRecord] Gagal menyimpan konten key '${key}':`, error);
    throw new Error(`Gagal menyimpan konten ${key}: ${error.message}`);
  }
}

/**
 * Memeriksa apakah suatu berkas storage di bucket 'site' sedang digunakan
 * pada konten (misalnya cover_image_url pada hero).
 */
export async function isSiteStoragePathInUse(path: string): Promise<boolean> {
  const heroContent = await getSiteContentRecord('hero');
  if (heroContent.cover_image_url && heroContent.cover_image_url.includes(path)) {
    return true;
  }
  return false;
}

export const SITE_CONTENT_TAG = 'site-content';

/**
 * Mengambil konten situs secara langsung tanpa cache
 */
export async function getSiteContentUncached<K extends SiteContentKey>(
  key: K
): Promise<SiteContentPayloadMap[K]> {
  return await getSiteContentRecord(key);
}

/**
 * Server Util getSiteContent<K>(key):
 * - Mengambil konten situs terkompilasi dengan cache tagging.
 * - Mengembalikan fallback default resmi jika record kosong di basis data.
 */
export async function getSiteContent<K extends SiteContentKey>(
  key: K
): Promise<SiteContentPayloadMap[K]> {
  const getCached = unstable_cache(
    async () => getSiteContentRecord(key),
    [`site-content-${key}`],
    {
      revalidate: 3600, // 1 jam TTL, langsung diinvalidasi saat admin menyimpan (on-demand revalidateTag)
      tags: [SITE_CONTENT_TAG, `${SITE_CONTENT_TAG}-${key}`],
    }
  );

  return await getCached();
}

