import {
  bannerFormSchema,
  type BannerFormInput,
} from '../../validations/banner.ts';
import {
  actionSuccess,
  actionError,
  type ActionResponse,
} from '../action-response.ts';
import type { Banner, BannerServiceDeps } from './types.ts';

export const BANNER_CACHE_TAG = 'active-banner';
export const BANNERS_TAG = 'banners';

/**
 * Revalidasi seluruh rute publik dan admin terkait banner promosi
 */
export function triggerBannerRevalidation(revalidate: BannerServiceDeps['revalidate']) {
  revalidate.revalidateTags([BANNER_CACHE_TAG, BANNERS_TAG]);
  revalidate.revalidatePaths(['/', '/admin/banners']);
}

/**
 * Eksekusi pembuatan banner baru
 */
export async function executeCreateBanner(
  rawInput: BannerFormInput,
  deps: BannerServiceDeps
): Promise<ActionResponse<Banner>> {
  try {
    await deps.auth.requireAdmin();

    const validated = bannerFormSchema.parse(rawInput);
    const created = await deps.db.createBanner(validated);

    triggerBannerRevalidation(deps.revalidate);

    return actionSuccess(created);
  } catch (err) {
    deps.logger.error('[executeCreateBanner] Error:', err);
    throw err;
  }
}

/**
 * Eksekusi pembaruan banner
 */
export async function executeUpdateBanner(
  id: string,
  rawInput: BannerFormInput,
  deps: BannerServiceDeps
): Promise<ActionResponse<Banner>> {
  try {
    await deps.auth.requireAdmin();

    const existing = await deps.db.getBannerById(id);
    if (!existing) {
      return actionError('Banner tidak ditemukan', 'NOT_FOUND');
    }

    const validated = bannerFormSchema.parse(rawInput);
    const updated = await deps.db.updateBanner(id, validated);

    triggerBannerRevalidation(deps.revalidate);

    return actionSuccess(updated);
  } catch (err) {
    deps.logger.error('[executeUpdateBanner] Error:', err);
    throw err;
  }
}

/**
 * Eksekusi penghapusan banner
 */
export async function executeDeleteBanner(
  id: string,
  deps: BannerServiceDeps
): Promise<ActionResponse<{ id: string }>> {
  try {
    await deps.auth.requireAdmin();

    const existing = await deps.db.getBannerById(id);
    if (!existing) {
      return actionError('Banner tidak ditemukan', 'NOT_FOUND');
    }

    await deps.db.deleteBanner(id);

    triggerBannerRevalidation(deps.revalidate);

    return actionSuccess({ id });
  } catch (err) {
    deps.logger.error('[executeDeleteBanner] Error:', err);
    throw err;
  }
}

/**
 * Eksekusi toggle aktif/nonaktif banner
 */
export async function executeToggleBannerActive(
  id: string,
  isActive: boolean,
  deps: BannerServiceDeps
): Promise<ActionResponse<Banner>> {
  try {
    await deps.auth.requireAdmin();

    const existing = await deps.db.getBannerById(id);
    if (!existing) {
      return actionError('Banner tidak ditemukan', 'NOT_FOUND');
    }

    const updated = await deps.db.toggleActive(id, isActive);

    triggerBannerRevalidation(deps.revalidate);

    return actionSuccess(updated);
  } catch (err) {
    deps.logger.error('[executeToggleBannerActive] Error:', err);
    throw err;
  }
}

