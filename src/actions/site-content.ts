'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  handleActionError,
  actionSuccess,
  actionError,
  type ActionResponse,
} from '@/lib/action-response';
import { logger } from '@/lib/logger';
import {
  executeSaveHeroContent,
  executeSaveAboutContent,
  executeSaveContactContent,
  executeSaveSocialContent,
  executeUploadSiteImage,
} from '@/lib/site-content/service';
import type {
  SiteContentServiceDeps,
  HeroContentPayload,
  AboutContentPayload,
  ContactContentPayload,
  SocialContentPayload,
} from '@/lib/site-content/types';
import {
  getSiteContentRecord,
  upsertSiteContentRecord,
  isSiteStoragePathInUse,
} from '@/lib/site-content/data-access';
import {
  type HeroContentInput,
  type AboutContentInput,
  type ContactContentInput,
  type SocialContentInput,
  validateSiteCleanupPaths,
} from '@/validations/site-content';

/**
 * Menyusun dependensi nyata untuk Server Actions site content
 */
async function getRealSiteContentServiceDeps(): Promise<SiteContentServiceDeps> {
  const supabase = await createClient();

  return {
    auth: {
      requireAdmin: async () => {
        const user = await requireAdmin();
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        };
      },
    },
    db: {
      getSiteContent: (key) => getSiteContentRecord(key),
      upsertSiteContent: (key, payload) => upsertSiteContentRecord(key, payload),
      isStoragePathInUse: (path) => isSiteStoragePathInUse(path),
    },
    storage: {
      upload: async (path, buffer, contentType) => {
        const { error: uploadError } = await supabase.storage
          .from('site')
          .upload(path, buffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('site').getPublicUrl(path);

        return { publicUrl };
      },
      remove: async (paths) => {
        if (!paths || paths.length === 0) return;
        await supabase.storage.from('site').remove(paths);
      },
      getPublicUrl: (path) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from('site').getPublicUrl(path);
        return publicUrl;
      },
    },
    revalidate: {
      revalidatePaths: (paths) => {
        paths.forEach((p) => revalidatePath(p));
      },
      revalidateTags: (tags) => {
        tags.forEach((t) => revalidateTag(t, { expire: 0 }));
      },
    },
    logger: {
      error: (msg: string, ...args: unknown[]) => {
        logger.error(msg, args.length > 0 ? { extra: args } : undefined);
      },
      info: (msg: string, ...args: unknown[]) => {
        logger.info(msg, args.length > 0 ? { extra: args } : undefined);
      },
    },
  };
}

/**
 * Server Action: Simpan Konten Hero
 */
export async function saveHeroContentAction(
  input: HeroContentInput
): Promise<ActionResponse<HeroContentPayload>> {
  try {
    const deps = await getRealSiteContentServiceDeps();
    return await executeSaveHeroContent(input, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Simpan Konten Tentang Kami
 */
export async function saveAboutContentAction(
  input: AboutContentInput
): Promise<ActionResponse<AboutContentPayload>> {
  try {
    const deps = await getRealSiteContentServiceDeps();
    return await executeSaveAboutContent(input, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Simpan Informasi Kontak & Operasional
 */
export async function saveContactContentAction(
  input: ContactContentInput
): Promise<ActionResponse<ContactContentPayload>> {
  try {
    const deps = await getRealSiteContentServiceDeps();
    return await executeSaveContactContent(input, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Simpan Tautan Media Sosial
 */
export async function saveSocialContentAction(
  input: SocialContentInput
): Promise<ActionResponse<SocialContentPayload>> {
  try {
    const deps = await getRealSiteContentServiceDeps();
    return await executeSaveSocialContent(input, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Upload Gambar Cover Hero
 */
export async function uploadSiteImageAction(
  formData: FormData
): Promise<ActionResponse<{ url: string; path: string }>> {
  try {
    await requireAdmin();

    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return actionError('Berkas gambar tidak ditemukan', 'BAD_REQUEST');
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const originalName = 'name' in file ? (file as File).name : 'hero-cover.jpg';

    const deps = await getRealSiteContentServiceDeps();
    return await executeUploadSiteImage(fileBuffer, originalName, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Pembersihan Berkas Storage yang Batal Disimpan (Orphan Prevention)
 */
export async function cleanupSiteImagesAction(
  paths: string[]
): Promise<ActionResponse<{ cleaned: number }>> {
  try {
    await requireAdmin();

    const validatedPaths = validateSiteCleanupPaths(paths);
    if (!validatedPaths || validatedPaths.length === 0) {
      return actionSuccess({ cleaned: 0 });
    }

    const supabase = await createClient();
    const pathsToDelete: string[] = [];

    for (const p of validatedPaths) {
      const inUse = await isSiteStoragePathInUse(p);
      if (!inUse) {
        pathsToDelete.push(p);
      }
    }

    if (pathsToDelete.length > 0) {
      await supabase.storage.from('site').remove(pathsToDelete);
    }

    return actionSuccess({ cleaned: pathsToDelete.length });
  } catch (error) {
    console.error('[cleanupSiteImagesAction] Gagal membersihkan berkas batal:', error);
    return actionSuccess({ cleaned: 0 }); // Best-effort: jangan menggagalkan UI
  }
}
