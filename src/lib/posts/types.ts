import type { PostStatus, PostFormValues } from '@/validations/post';

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string | null;
  author_name: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  status: PostStatus;
  published_at: string | null;
  reading_time_minutes: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PostListResponse {
  items: PostListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface PostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string | null;
  author_name: string;
  author_id?: string | null;
  category_id: string;
  status: PostStatus;
  published_at: string | null;
  reading_time_minutes: number;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface BlogCategoryOption {
  id: string;
  name: string;
  slug: string;
}

// ============================================================================
// ADAPTER INTERFACES UNTUK DEPENDENCY INJECTION (SERVICE & UNIT TESTING)
// ============================================================================

export interface AuthUserContext {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface PostStorageAdapter {
  upload(
    path: string,
    buffer: Buffer | Uint8Array,
    contentType: string
  ): Promise<{ publicUrl: string }>;
  remove(paths: string[]): Promise<void>;
  getPublicUrl(path: string): string;
}

export interface PostDbAdapter {
  checkSlugConflict(slug: string, excludeId?: string): Promise<boolean>;
  getPostById(id: string): Promise<PostDetail | null>;
  createPost(data: PostFormValues, readingTimeMinutes: number, authorId: string): Promise<string>;
  updatePost(id: string, data: PostFormValues, readingTimeMinutes: number): Promise<string>;
  deletePost(id: string): Promise<{
    id: string;
    coverUrl: string | null;
    content: string;
  }>;
  toggleStatus(id: string, status: PostStatus): Promise<void>;
  isStoragePathInUse(path: string, excludePostId?: string): Promise<boolean>;
}

export interface PostServiceDeps {
  auth: {
    requireAdmin: () => Promise<AuthUserContext>;
  };
  db: PostDbAdapter;
  storage: PostStorageAdapter;
  revalidate: (paths: string[]) => void;
  logger?: {
    error: (msg: string, ...args: unknown[]) => void;
    info: (msg: string, ...args: unknown[]) => void;
  };
  supabaseUrl?: string;
}
