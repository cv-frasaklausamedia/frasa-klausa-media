import type {
  HeroContentPayload,
  AboutContentPayload,
  ContactContentPayload,
  SocialContentPayload,
  SiteContent,
} from '../../types/index.ts';
import type { SiteContentKey } from '../../validations/site-content.ts';

export type {
  HeroContentPayload,
  AboutContentPayload,
  ContactContentPayload,
  SocialContentPayload,
  SiteContent,
  SiteContentKey,
};

export type SiteContentPayloadMap = {
  hero: HeroContentPayload;
  about: AboutContentPayload;
  contact: ContactContentPayload;
  social: SocialContentPayload;
};

export interface SiteContentServiceDeps {
  auth: {
    requireAdmin: () => Promise<{ id: string; email?: string; role: string; isActive: boolean }>;
  };
  db: {
    getSiteContent: <K extends SiteContentKey>(key: K) => Promise<SiteContentPayloadMap[K]>;
    upsertSiteContent: <K extends SiteContentKey>(
      key: K,
      payload: SiteContentPayloadMap[K]
    ) => Promise<void>;
    isStoragePathInUse: (path: string) => Promise<boolean>;
  };
  storage: {
    upload: (
      path: string,
      buffer: Buffer,
      contentType: string
    ) => Promise<{ publicUrl: string }>;
    remove: (paths: string[]) => Promise<void>;
    getPublicUrl: (path: string) => string;
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
