import {
  heroContentSchema,
  aboutContentSchema,
  contactContentSchema,
  socialContentSchema,
  MAX_SITE_IMAGE_SIZE_BYTES,
  type HeroContentInput,
  type AboutContentInput,
  type ContactContentInput,
  type SocialContentInput,
  type SiteContentKey,
} from '../../validations/site-content.ts';
import { validateImageMagicBytes } from '../../validations/profile.ts';
import { sanitizeSiteNarrativeHtml } from '../sanitizer.ts';
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from '../action-response.ts';
import type {
  SiteContentServiceDeps,
  HeroContentPayload,
  AboutContentPayload,
  ContactContentPayload,
  SocialContentPayload,
} from './types.ts';

export const SITE_CONTENT_TAG = 'site-content';

/**
 * Revalidasi cache publik dan admin berdasarkan key yang diperbarui
 */
export function triggerSiteContentRevalidation(
  key: SiteContentKey,
  revalidate: SiteContentServiceDeps['revalidate']
) {
  revalidate.revalidateTags([SITE_CONTENT_TAG, `${SITE_CONTENT_TAG}-${key}`]);

  const pathsToRevalidate = ['/admin/site-content', '/'];
  if (key === 'about' || key === 'social') {
    pathsToRevalidate.push('/tentang-kami');
  }
  if (key === 'contact' || key === 'social') {
    pathsToRevalidate.push('/kontak');
  }

  revalidate.revalidatePaths(pathsToRevalidate);
}

/**
 * Eksekusi penyimpanan konten Hero Beranda
 */
export async function executeSaveHeroContent(
  rawInput: HeroContentInput,
  deps: SiteContentServiceDeps
): Promise<ActionResponse<HeroContentPayload>> {
  try {
    await deps.auth.requireAdmin();

    const validated = heroContentSchema.parse(rawInput);
    await deps.db.upsertSiteContent('hero', validated);

    triggerSiteContentRevalidation('hero', deps.revalidate);

    return actionSuccess(validated);
  } catch (err) {
    deps.logger.error('[executeSaveHeroContent] Error:', err);
    throw err;
  }
}

/**
 * Eksekusi penyimpanan konten Tentang Kami
 */
export async function executeSaveAboutContent(
  rawInput: AboutContentInput,
  deps: SiteContentServiceDeps
): Promise<ActionResponse<AboutContentPayload>> {
  try {
    await deps.auth.requireAdmin();

    const validated = aboutContentSchema.parse(rawInput);

    // Sanitasi teks narasi sejarah untuk mencegah XSS (PRD §15.5)
    const sanitizedHistory = sanitizeSiteNarrativeHtml(validated.history);

    const payloadToSave: AboutContentPayload = {
      ...validated,
      history: sanitizedHistory,
    };

    await deps.db.upsertSiteContent('about', payloadToSave);

    triggerSiteContentRevalidation('about', deps.revalidate);

    return actionSuccess(payloadToSave);
  } catch (err) {
    deps.logger.error('[executeSaveAboutContent] Error:', err);
    throw err;
  }
}

/**
 * Eksekusi penyimpanan informasi Kontak & Operasional
 */
export async function executeSaveContactContent(
  rawInput: ContactContentInput,
  deps: SiteContentServiceDeps
): Promise<ActionResponse<ContactContentPayload>> {
  try {
    await deps.auth.requireAdmin();

    const validated = contactContentSchema.parse(rawInput);
    await deps.db.upsertSiteContent('contact', validated);

    triggerSiteContentRevalidation('contact', deps.revalidate);

    return actionSuccess(validated);
  } catch (err) {
    deps.logger.error('[executeSaveContactContent] Error:', err);
    throw err;
  }
}

/**
 * Eksekusi penyimpanan tautan Media Sosial
 */
export async function executeSaveSocialContent(
  rawInput: SocialContentInput,
  deps: SiteContentServiceDeps
): Promise<ActionResponse<SocialContentPayload>> {
  try {
    await deps.auth.requireAdmin();

    const validated = socialContentSchema.parse(rawInput);
    await deps.db.upsertSiteContent('social', validated);

    triggerSiteContentRevalidation('social', deps.revalidate);

    return actionSuccess(validated);
  } catch (err) {
    deps.logger.error('[executeSaveSocialContent] Error:', err);
    throw err;
  }
}

/**
 * Eksekusi pengunggahan gambar cover Hero ke storage bucket 'site'
 */
export async function executeUploadSiteImage(
  fileBuffer: Buffer,
  originalFilename: string,
  deps: SiteContentServiceDeps
): Promise<ActionResponse<{ url: string; path: string }>> {
  try {
    await deps.auth.requireAdmin();

    // 1. Validasi ukuran file (maksimal 5MB)
    if (fileBuffer.length > MAX_SITE_IMAGE_SIZE_BYTES) {
      return actionError(
        'Ukuran gambar melebihi batas maksimal 5 MB',
        'BAD_REQUEST'
      );
    }

    // 2. Validasi Magic Bytes (keamanan anti spoofing ekstensi file)
    const magic = validateImageMagicBytes(fileBuffer);
    if (!magic.isValid || !magic.canonicalMime || !magic.ext) {
      return actionError(
        'Format gambar tidak didukung. Harap unggah format JPG, PNG, atau WebP yang valid.',
        'BAD_REQUEST'
      );
    }

    // 3. Bangun path penyimpanan acak (UUID)
    const fileId = crypto.randomUUID();
    const storagePath = `hero/${fileId}.${magic.ext}`;

    // 4. Unggah ke bucket 'site'
    const { publicUrl } = await deps.storage.upload(
      storagePath,
      fileBuffer,
      magic.canonicalMime
    );

    return actionSuccess({ url: publicUrl, path: storagePath });
  } catch (err) {
    deps.logger.error('[executeUploadSiteImage] Error:', err);
    throw err;
  }
}

