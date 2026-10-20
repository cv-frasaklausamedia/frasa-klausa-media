const DEFAULT_APP_URL = 'https://frasaklausamedia.com';
const FALLBACK_IMAGE_PATH = '/og/frasa-klausa-media.jpg';

export interface OpenGraphImageInput {
  sourceUrl?: string | null;
  alt: string;
}

export interface OpenGraphImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  type?: string;
}

function normalizeAppUrl(appUrl = process.env.NEXT_PUBLIC_APP_URL): string {
  try {
    return new URL(appUrl || DEFAULT_APP_URL).origin;
  } catch {
    return DEFAULT_APP_URL;
  }
}

/**
 * Hanya URL object Storage public milik project Supabase yang boleh menjadi
 * og:image dinamis. URL bertanda tangan tidak digunakan agar crawler WhatsApp
 * tidak gagal setelah tanda tangan kedaluwarsa.
 */
export function isPublicSupabaseStorageUrl(
  sourceUrl: string,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
): boolean {
  try {
    const imageUrl = new URL(sourceUrl);
    const configuredSupabaseUrl = supabaseUrl ? new URL(supabaseUrl) : null;
    const isConfiguredProject = configuredSupabaseUrl
      ? imageUrl.host === configuredSupabaseUrl.host
      : imageUrl.hostname.endsWith('.supabase.co');

    return (
      imageUrl.protocol === 'https:' &&
      isConfiguredProject &&
      imageUrl.pathname.startsWith('/storage/v1/object/public/')
    );
  } catch {
    return false;
  }
}

export function getFallbackOpenGraphImage(alt: string, appUrl?: string): OpenGraphImage {
  return {
    url: new URL(FALLBACK_IMAGE_PATH, normalizeAppUrl(appUrl)).toString(),
    alt,
    width: 1200,
    height: 630,
    type: 'image/jpeg',
  };
}

export function getOpenGraphImage({ sourceUrl, alt }: OpenGraphImageInput): OpenGraphImage {
  if (sourceUrl && isPublicSupabaseStorageUrl(sourceUrl)) {
    return { url: sourceUrl, alt };
  }

  return getFallbackOpenGraphImage(alt);
}
