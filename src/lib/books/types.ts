import type {
  BookGalleryItem,
  BookQueryParams,
  PublicCatalogQueryParams,
} from '../../validations/book.ts';

export type { BookGalleryItem, BookQueryParams, PublicCatalogQueryParams };

/**
 * DTO untuk daftar buku di tabel Admin (kolom eksplisit dan hemat bandwidth)
 */
export interface BookListItem {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  author: string;
  price_regular: number;
  price_promo: number | null;
  is_featured: boolean;
  is_published: boolean;
  publish_year: number;
  isbn: string | null;
  created_at: string;
  updated_at: string;
  category_id: string;
  category_name: string;
  category_slug?: string;
}

/**
 * DTO buku lengkap untuk form edit dan rincian administratif
 */
export interface BookDetail extends BookListItem {
  description: string;
  editor: string | null;
  publisher: string;
  page_count: number;
  shopee_url: string | null;
  tokopedia_url: string | null;
  whatsapp_number: string;
  whatsapp_message_template: string | null;
  seo_title: string | null;
  seo_description: string | null;
  gallery: BookGalleryItem[];
  related_book_ids: string[];
}

/**
 * Respons data tabel buku dengan pagination metadata
 */
export interface BookListResponse {
  items: BookListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/**
 * Opsi dropdown filter kategori di toolbar tabel buku
 */
export interface BookCategoryOption {
  id: string;
  name: string;
  slug: string;
}

/**
 * DTO ringkas untuk modal pemilih relasi buku terkait (combobox/search modal)
 */
export interface BookRelatedOption {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  author: string;
  price_regular: number;
  price_promo: number | null;
  category_name?: string;
}

/**
 * Hasil kembalian transaksi atomik RPC upsert_book_atomic
 */
export interface BookMutationResult {
  book_id: string;
  unused_image_urls: string[];
}
