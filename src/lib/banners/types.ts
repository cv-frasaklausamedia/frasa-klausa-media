import type { Banner } from '../../types/index.ts';
import type { BannerFormValues } from '../../validations/banner.ts';

export type { Banner };

export type BannerScheduleStatus = 'active_now' | 'upcoming' | 'expired' | 'inactive';

export interface BannerWithComputedStatus extends Banner {
  scheduleStatus: BannerScheduleStatus;
}

export interface BannerListResponse {
  data: BannerWithComputedStatus[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    counts: {
      all: number;
      active_now: number;
      upcoming: number;
      expired: number;
      inactive: number;
    };
  };
}

export interface BannerServiceDeps {
  auth: {
    requireAdmin: () => Promise<{ id: string; email?: string; role: string; isActive: boolean }>;
  };
  db: {
    getBannerById: (id: string) => Promise<Banner | null>;
    createBanner: (data: BannerFormValues) => Promise<Banner>;
    updateBanner: (id: string, data: BannerFormValues) => Promise<Banner>;
    deleteBanner: (id: string) => Promise<void>;
    toggleActive: (id: string, isActive: boolean) => Promise<Banner>;
  };
  revalidate: {
    revalidatePaths: (paths: string[]) => void;
    revalidateTags: (tags: string[]) => void;
  };
  logger: {
    info?: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}
