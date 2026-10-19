import { createClient } from '@/lib/supabase/server';
import type { SystemSettingsPayload, GeneralSettings, FeatureSettings } from '@/types/settings';
import type { Json } from '@/types/database';

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  site_name: 'Frasa Klausa Media',
  site_tagline: 'Penerbit Buku Berkualitas & Ruang Literasi Terbuka',
  contact_email: 'frasaklausamedia@gmail.com',
  contact_phone: '0813-8060-4256',
  contact_whatsapp: '0813-8060-4256',
  office_address: 'Jakarta, Indonesia',
  default_meta_description:
    'Penerbit buku independen yang menghadirkan karya sastra, fiksi, puisi, dan esai pemikiran bermutu.',
};

export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
  enable_blog_comments: false,
  enable_public_registration: false,
  maintenance_mode: false,
  enable_marketplace_redirect: true,
};

/**
 * Mengambil konfigurasi platform dari tabel system_settings / view pengaturan
 */
export async function getSystemSettingsRecord(): Promise<SystemSettingsPayload> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error || !data) {
      console.warn('[getSystemSettingsRecord] Memakai nilai default pengaturan:', error?.message);
      return {
        general: DEFAULT_GENERAL_SETTINGS,
        features: DEFAULT_FEATURE_SETTINGS,
      };
    }

    const generalRow = data.find((row) => row.key === 'general');
    const featuresRow = data.find((row) => row.key === 'features');

    const general: GeneralSettings = {
      ...DEFAULT_GENERAL_SETTINGS,
      ...(generalRow?.value as Partial<GeneralSettings>),
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
