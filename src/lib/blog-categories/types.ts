import type { BlogCategoryFormInput, BlogCategoryQueryParams } from '@/validations/blog-category';

export interface BlogCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  post_count: number;
}

export interface BlogCategoryListResponse {
  items: BlogCategoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export type { BlogCategoryFormInput, BlogCategoryQueryParams };
