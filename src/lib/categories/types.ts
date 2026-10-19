import type { CategoryFormInput, CategoryQueryParams } from '@/validations/category';

export interface BookCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  book_count: number;
}

export interface CategoryListResponse {
  items: BookCategoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export type { CategoryFormInput, CategoryQueryParams };
