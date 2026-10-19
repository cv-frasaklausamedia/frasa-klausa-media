'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  handleActionError,
  type ActionResponse,
} from '@/lib/action-response';
import {
  executeCreateBanner,
  executeUpdateBanner,
  executeDeleteBanner,
  executeToggleBannerActive,
} from '@/lib/banners/service';
import type { Banner, BannerServiceDeps } from '@/lib/banners/types';
import {
  getBannerById,
  createBannerRecord,
  updateBannerRecord,
  deleteBannerRecord,
  toggleBannerActiveRecord,
} from '@/lib/banners/data-access';
import type { BannerFormInput } from '@/validations/banner';

/**
 * Menyusun dependensi nyata untuk dieksekusi di Server Actions banner
 */
async function getRealBannerServiceDeps(): Promise<BannerServiceDeps> {
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
      getBannerById: (id) => getBannerById(id),
      createBanner: (data) => createBannerRecord(data),
      updateBanner: (id, data) => updateBannerRecord(id, data),
      deleteBanner: (id) => deleteBannerRecord(id),
      toggleActive: (id, isActive) => toggleBannerActiveRecord(id, isActive),
    },
    revalidate: {
      revalidatePaths: (paths) => {
        paths.forEach((p) => revalidatePath(p));
      },
      revalidateTags: (tags) => {
        tags.forEach((t) => revalidateTag(t, { expire: 0 }));
      },
    },
    logger: console,
  };
}

/**
 * Server Action: Tambah Banner Promosi
 */
export async function createBannerAction(
  input: BannerFormInput
): Promise<ActionResponse<Banner>> {
  try {
    const deps = await getRealBannerServiceDeps();
    return await executeCreateBanner(input, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Perbarui Banner Promosi
 */
export async function updateBannerAction(
  id: string,
  input: BannerFormInput
): Promise<ActionResponse<Banner>> {
  try {
    const deps = await getRealBannerServiceDeps();
    return await executeUpdateBanner(id, input, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Hapus Banner Promosi
 */
export async function deleteBannerAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const deps = await getRealBannerServiceDeps();
    return await executeDeleteBanner(id, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Toggle Status Aktif Banner
 */
export async function toggleBannerActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResponse<Banner>> {
  try {
    const deps = await getRealBannerServiceDeps();
    return await executeToggleBannerActive(id, isActive, deps);
  } catch (error) {
    return handleActionError(error);
  }
}
