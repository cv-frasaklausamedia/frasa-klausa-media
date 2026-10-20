import { createClient } from '@/lib/supabase/server';
import { getSiteContentRecord } from '@/lib/site-content/data-access';
import type { SystemSettingsPayload, GeneralSettings, FeatureSettings } from '@/types/settings';
import type { Json } from '@/types/database';

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  site_name: 'Frasa Klausa Media',
  site_tagline: 'Mewujudkan Naskah Menjadi Buku',
  contact_email: 'frasaklausamedia@gmail.com',
  contact_phone: '0813-8060-4256',
  contact_whatsapp: '0813-8060-4256',
  office_address: 'Jl. Literasi No. 42, RT 03 / RW 05, Jakarta Timur, DKI Jakarta 13420',
  default_meta_description:
    'Website resmi dan katalog buku Frasa Klausa Media. Mewujudkan Naskah Menjadi Buku. Temukan novel, puisi, esai, dan karya sastra Indonesia berkualitas tinggi.',
};

export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
  enable_blog_comments: false,
  enable_public_registration: false,
  maintenance_mode: false,
  enable_marketplace_redirect: true,
};

/**
 * Mengambil konfigurasi platform dari tabel system_settings / view pengaturan,
 * disinkronkan secara harmonis dengan konten kontak aktif pada site_content.
 */
export async function getSystemSettingsRecord(): Promise<SystemSettingsPayload> {
  try {
    let data: { key: string; value: Json }[] | null = null;

    try {
      const supabase = await createClient();
      const settingsRes = await supabase.from('system_settings').select('key, value');
      data = settingsRes.data;
    } catch {
      // Mengabaikan error cookies() pada saat static prerender build Next.js
    }

    const contactContent = await getSiteContentRecord('contact').catch(() => null);

    const generalRow = data?.find((row) => row.key === 'general');
    const featuresRow = data?.find((row) => row.key === 'features');

    const generalVal = (generalRow?.value as Partial<GeneralSettings>) || {};

    const general: GeneralSettings = {
      site_name: generalVal.site_name || contactContent?.company_name || DEFAULT_GENERAL_SETTINGS.site_name,
      site_tagline:
        generalVal.site_tagline && generalVal.site_tagline !== 'Penerbit Buku Berkualitas & Ruang Literasi Terbuka'
          ? generalVal.site_tagline
          : (contactContent?.tagline || DEFAULT_GENERAL_SETTINGS.site_tagline),
      contact_email: generalVal.contact_email || contactContent?.email || DEFAULT_GENERAL_SETTINGS.contact_email,
      contact_phone: generalVal.contact_phone || contactContent?.phone || DEFAULT_GENERAL_SETTINGS.contact_phone,
      contact_whatsapp: generalVal.contact_whatsapp || contactContent?.whatsapp || DEFAULT_GENERAL_SETTINGS.contact_whatsapp,
      office_address:
        generalVal.office_address && generalVal.office_address !== 'Jakarta, Indonesia'
          ? generalVal.office_address
          : (contactContent?.address || DEFAULT_GENERAL_SETTINGS.office_address),
      default_meta_description: generalVal.default_meta_description || DEFAULT_GENERAL_SETTINGS.default_meta_description,
    };

    const features: FeatureSettings = {
      ...DEFAULT_FEATURE_SETTINGS,
      ...(featuresRow?.value as Partial<FeatureSettings>),
    };

    return { general, features };
  } catch (err) {
    console.error('[getSystemSettingsRecord] Error reading system settings:', err);
    return {
      general: DEFAULT_GENERAL_SETTINGS,
      features: DEFAULT_FEATURE_SETTINGS,
    };
  }
}

/**
 * Menyimpan konfigurasi ke tabel system_settings
 */
export async function updateSystemSettingsRecord(
  key: 'general' | 'features',
  value: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('system_settings')
    .upsert(
      {
        key,
        value: value as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
