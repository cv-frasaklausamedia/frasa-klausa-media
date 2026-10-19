import { z } from 'zod';

/**
 * Skema validasi query pencarian global (Command Dialog Ctrl+K)
 */
export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Query pencarian wajib diisi' })
    .trim()
    .min(2, { message: 'Query pencarian minimal 2 karakter' })
    .max(100, { message: 'Query pencarian maksimal 100 karakter' }),
  limit: z.coerce
    .number()
    .int({ message: 'Limit harus berupa bilangan bulat' })
    .min(1, { message: 'Limit minimal 1' })
    .max(50, { message: 'Limit maksimal 50' })
    .default(10),
});

export type SearchQueryInput = z.input<typeof searchQuerySchema>;
export type SearchQueryValues = z.output<typeof searchQuerySchema>;

export interface BookSearchResultItem {
  id: string;
  type: 'book';
  title: string;
  slug: string;
  cover_url: string | null;
  author: string | null;
  price: number | null;
  promo_price: number | null;
  similarity_score: number;
}

export interface PostSearchResultItem {
  id: string;
  type: 'post';
  title: string;
  slug: string;
  cover_url: string | null;
  excerpt: string | null;
  published_at: string | null;
  similarity_score: number;
}

export interface GroupedSearchResults {
  books: BookSearchResultItem[];
  posts: PostSearchResultItem[];
  total: number;
}
