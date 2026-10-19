import 'server-only';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/configs/env';
import type { Database } from '@/types/database';
import type {
  BookListItem,
  BookDetail,
  BookListResponse,
  BookCategoryOption,
  BookRelatedOption,
  BookMutationResult,
} from './types';
import { parseRpcMutationResult } from './service';
import type { BookQueryParams, BookFormValues } from '@/validations/book';

/**
 * Sanitasi string pencarian agar tidak merusak filter ILIKE atau PostgREST syntax
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[%_\\*]/g, '')
    .replace(/[,()]/g, ' ')
    .trim();
}

interface RawBookDbRow {
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
  book_categories?: { id: string; name: string } | { id: string; name: string }[] | null;
}

function mapBookRow(row: RawBookDbRow): BookListItem {
  let categoryName = 'Tanpa Kategori';
  if (row.book_categories) {
    if (Array.isArray(row.book_categories) && row.book_categories.length > 0) {
      categoryName = row.book_categories[0]?.name ?? 'Tanpa Kategori';
    } else if ('name' in row.book_categories) {
      categoryName = (row.book_categories as { name: string }).name ?? 'Tanpa Kategori';
    }
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    cover_url: row.cover_url,
    author: row.author,
    price_regular: Number(row.price_regular) || 0,
    price_promo: row.price_promo !== null && row.price_promo !== undefined ? Number(row.price_promo) : null,
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    publish_year: Number(row.publish_year) || new Date().getFullYear(),
    isbn: row.isbn,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category_id: row.category_id,
    category_name: categoryName,
  };
}

/**
 * Mengambil daftar buku untuk admin dengan filter, pencarian, sorting, dan paginasi
 */
export async function getAdminBooks(params: BookQueryParams): Promise<BookListResponse> {
  await connection();
  const supabase = await createClient();

  const { page, pageSize, q, category_id, categoryId, status, sort } = params;
  const effectiveCategory = category_id || categoryId;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('books')
    .select(
      'id, title, slug, cover_url, author, price_regular, price_promo, is_featured, is_published, publish_year, isbn, created_at, updated_at, category_id, book_categories(id, name)',
      { count: 'exact' }
    );

  // 1. Filter Pencarian Teks
  const cleanQ = sanitizeSearchQuery(q);
  if (cleanQ) {
    query = query.or(
      `title.ilike.%${cleanQ}%,author.ilike.%${cleanQ}%,isbn.ilike.%${cleanQ}%`
    );
  }

  // 2. Filter Kategori
  if (effectiveCategory && effectiveCategory !== 'all') {
    query = query.eq('category_id', effectiveCategory);
  }

  // 3. Filter Status Publikasi
  if (status === 'published') {
    query = query.eq('is_published', true);
  } else if (status === 'draft') {
    query = query.eq('is_published', false);
  }

  // 4. Sorting Allowlist
  switch (sort) {
    case 'created_at_asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'title_asc':
      query = query.order('title', { ascending: true });
      break;
    case 'title_desc':
      query = query.order('title', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price_regular', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_regular', { ascending: false });
      break;
    case 'year_asc':
      query = query.order('publish_year', { ascending: true });
      break;
    case 'year_desc':
      query = query.order('publish_year', { ascending: false });
      break;
    case 'created_at_desc':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // 5. Paginasi
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getAdminBooks] Supabase query error:', error);
    throw error;
  }

  const totalCount = count ?? 0;
  const pageCount = Math.ceil(totalCount / pageSize) || 1;
  const items = ((data as unknown as RawBookDbRow[]) || []).map(mapBookRow);

  return {
    items,
    totalCount,
    page,
    pageSize,
    pageCount,
  };
}

/**
 * Mengambil detail lengkap buku berdasarkan ID untuk form edit
 */
export async function getBookById(id: string): Promise<BookDetail | null> {
  await connection();
  const supabase = await createClient();

  const { data: bookRow, error: bookError } = await supabase
    .from('books')
    .select(
      'id, title, slug, description, cover_url, category_id, author, editor, publisher, publish_year, isbn, page_count, price_regular, price_promo, is_featured, is_published, shopee_url, tokopedia_url, whatsapp_number, whatsapp_message_template, seo_title, seo_description, created_at, updated_at, book_categories(id, name)'
    )
    .eq('id', id)
    .maybeSingle();

  if (bookError || !bookRow) {
    return null;
  }

  // Ambil galeri gambar terurut
  const { data: galleryRows } = await supabase
    .from('book_images')
    .select('id, image_url, alt_text, sort_order')
    .eq('book_id', id)
    .order('sort_order', { ascending: true });

  // Ambil relasi buku terkait
  const { data: relatedRows } = await supabase
    .from('book_related')
    .select('related_id')
    .eq('book_id', id);

  const baseItem = mapBookRow(bookRow as unknown as RawBookDbRow);

  return {
    ...baseItem,
    description: (bookRow as { description?: string }).description ?? '',
    editor: (bookRow as { editor?: string | null }).editor ?? null,
    publisher: (bookRow as { publisher?: string }).publisher ?? 'Frasa Klausa Media',
    page_count: Number((bookRow as { page_count?: number }).page_count) || 1,
    shopee_url: (bookRow as { shopee_url?: string | null }).shopee_url ?? null,
    tokopedia_url: (bookRow as { tokopedia_url?: string | null }).tokopedia_url ?? null,
    whatsapp_number: (bookRow as { whatsapp_number?: string }).whatsapp_number ?? '6281380604256',
    whatsapp_message_template: (bookRow as { whatsapp_message_template?: string | null }).whatsapp_message_template ?? null,
    seo_title: (bookRow as { seo_title?: string | null }).seo_title ?? null,
    seo_description: (bookRow as { seo_description?: string | null }).seo_description ?? null,
    gallery: (galleryRows || []).map((img) => ({
      id: img.id,
      image_url: img.image_url,
      alt_text: (img as { alt_text?: string }).alt_text ?? '',
      sort_order: Number(img.sort_order) || 0,
    })),
    related_book_ids: (relatedRows || []).map((r) => r.related_id),
  };
}

/**
 * Pengecekan keunikan slug buku (409 Conflict)
 */
export async function checkBookSlugConflict(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase.from('books').select('id', { head: true, count: 'exact' }).eq('slug', slug);
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count, error } = await query;
  if (error) {
    console.error('[checkBookSlugConflict] Error checking slug:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Memanggil fungsi RPC atomik upsert_book_atomic di Supabase
 */
export async function callUpsertBookAtomic(
  bookId: string | null,
  data: BookFormValues
): Promise<BookMutationResult> {
  const supabase = await createClient();

  // Susun payload parameter RPC
  const rpcArgs = {
    p_book_id: bookId,
    p_title: data.title,
    p_slug: data.slug,
    p_description: data.description,
    p_cover_url: data.cover_url,
    p_category_id: data.category_id,
    p_author: data.author,
    p_editor: data.editor,
    p_publisher: data.publisher,
    p_publish_year: data.publish_year,
    p_isbn: data.isbn,
    p_page_count: data.page_count,
    p_price_regular: data.price_regular,
    p_price_promo: data.price_promo,
    p_is_featured: data.is_featured,
    p_is_published: data.is_published,
    p_shopee_url: data.shopee_url,
    p_tokopedia_url: data.tokopedia_url,
    p_whatsapp_number: data.whatsapp_number,
    p_whatsapp_message_template: data.whatsapp_message_template,
    p_seo_title: data.seo_title,
    p_seo_description: data.seo_description,
    p_gallery_images: data.gallery as unknown as Database['public']['Tables']['books']['Insert'],
    p_related_book_ids: data.related_book_ids,
  };

  const { data: resultData, error: rpcError } = await supabase.rpc(
    'upsert_book_atomic',
    rpcArgs
  );

  if (rpcError) {
    console.error('[callUpsertBookAtomic] RPC Execution Error:', rpcError);
    throw rpcError;
  }

  return parseRpcMutationResult(resultData);
}

/**
 * Memeriksa apakah suatu path storage masih digunakan oleh buku lain
 * Menggunakan kesamaan persis URL publik yang disusun dari supabaseUrl + path (bukan LIKE)
 */
export async function checkIfStoragePathInUse(
  path: string,
  excludeBookId?: string
): Promise<boolean> {
  const supabase = await createClient();
  const cleanPath = path.trim().replace(/^\/+/, '');
  const exactPublicUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/books/${cleanPath}`;

  // 1. Cek kesamaan persis cover_url pada buku lain
  let coverQuery = supabase
    .from('books')
    .select('id', { head: true, count: 'exact' })
    .eq('cover_url', exactPublicUrl);

  if (excludeBookId) {
    coverQuery = coverQuery.neq('id', excludeBookId);
  }

  const { count: coverCount } = await coverQuery;
  if ((coverCount ?? 0) > 0) return true;

  // 2. Cek kesamaan persis image_url pada book_images buku lain
  let galleryQuery = supabase
    .from('book_images')
    .select('id', { head: true, count: 'exact' })
    .eq('image_url', exactPublicUrl);

  if (excludeBookId) {
    galleryQuery = galleryQuery.neq('book_id', excludeBookId);
  }

  const { count: galleryCount } = await galleryQuery;
  return (galleryCount ?? 0) > 0;
}

/**
 * Menghapus record buku dan mengambil daftar seluruh URL gambarnya untuk pembersihan storage
 */
export async function deleteBookRecord(id: string): Promise<{
  id: string;
  coverUrl: string | null;
  galleryUrls: string[];
}> {
  const supabase = await createClient();

  // 1. Ambil URL gambar sebelum record dihapus
  const { data: bookRow } = await supabase
    .from('books')
    .select('cover_url')
    .eq('id', id)
    .maybeSingle();

  const { data: galleryRows } = await supabase
    .from('book_images')
    .select('image_url')
    .eq('book_id', id);

  const coverUrl = bookRow?.cover_url ?? null;
  const galleryUrls = (galleryRows || []).map((r) => r.image_url);

  // 2. Hapus record buku (cascade menghapus book_images dan book_related)
  const { error } = await supabase.from('books').delete().eq('id', id);

  if (error) {
    console.error('[deleteBookRecord] Error deleting book:', error);
    throw error;
  }

  return { id, coverUrl, galleryUrls };
}

/**
 * Memperbarui toggle field cepat (is_published / is_featured)
 */
export async function toggleBookField(
  id: string,
  field: 'is_published' | 'is_featured',
  value: boolean
): Promise<void> {
  const supabase = await createClient();

  const updatePayload =
    field === 'is_published'
      ? { is_published: value, updated_at: new Date().toISOString() }
      : { is_featured: value, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from('books')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error(`[toggleBookField] Error updating ${field}:`, error);
    throw error;
  }
}

/**
 * Mengambil daftar opsi kategori untuk dropdown toolbar dan form
 */
export async function getBookCategoriesOptions(): Promise<BookCategoryOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('book_categories')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('[getBookCategoriesOptions] Error:', error);
    return [];
  }

  return data || [];
}

/**
 * Pencarian buku ringan untuk modal pemilih buku terkait
 */
export async function searchBooksForRelated(
  q: string,
  excludeId?: string,
  limit = 10
): Promise<BookRelatedOption[]> {
  const supabase = await createClient();
  const cleanQ = sanitizeSearchQuery(q);

  let query = supabase
    .from('books')
    .select('id, title, slug, cover_url, author, price_regular, price_promo, book_categories(name)')
    .eq('is_published', true)
    .limit(limit);

  if (cleanQ) {
    query = query.or(`title.ilike.%${cleanQ}%,author.ilike.%${cleanQ}%`);
  }

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[searchBooksForRelated] Error:', error);
    return [];
  }

  return ((data as unknown as RawBookDbRow[]) || []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    cover_url: row.cover_url,
    author: row.author,
    price_regular: Number(row.price_regular) || 0,
    price_promo: row.price_promo ? Number(row.price_promo) : null,
    category_name: row.book_categories && 'name' in row.book_categories ? (row.book_categories as { name: string }).name : undefined,
  }));
}

/**
 * Rekomendasi Buku Terkait Hibrida (Manual + Fallback Kategori Otomatis) untuk publik
 */
export async function getRelatedBooks(
  bookId: string,
  categoryId: string,
  limit = 5
): Promise<BookRelatedOption[]> {
  const supabase = await createClient();

  // 1. Ambil relasi manual dari book_related yang berstatus is_published = true
  const { data: manualRelations } = await supabase
    .from('book_related')
    .select(
      'related_id, books!book_related_related_id_fkey(id, title, slug, cover_url, author, price_regular, price_promo, is_published)'
    )
    .eq('book_id', bookId)
    .limit(limit);

  const results: BookRelatedOption[] = [];
  const pickedIds = new Set<string>([bookId]);

  if (manualRelations) {
    for (const item of manualRelations) {
      const b = (item as unknown as { books: RawBookDbRow | null }).books;
      if (b && b.is_published) {
        pickedIds.add(b.id);
        results.push({
          id: b.id,
          title: b.title,
          slug: b.slug,
          cover_url: b.cover_url,
          author: b.author,
          price_regular: Number(b.price_regular) || 0,
          price_promo: b.price_promo ? Number(b.price_promo) : null,
        });
      }
    }
  }

  // 2. Jika belum mencapai limit, lengkapi otomatis dari kategori yang sama
  const needed = limit - results.length;
  if (needed > 0 && categoryId) {
    const { data: fallbackBooks } = await supabase
      .from('books')
      .select('id, title, slug, cover_url, author, price_regular, price_promo')
      .eq('category_id', categoryId)
      .eq('is_published', true)
      .not('id', 'in', `(${Array.from(pickedIds).join(',')})`)
      .order('created_at', { ascending: false })
      .limit(needed);

    if (fallbackBooks) {
      for (const b of fallbackBooks) {
        results.push({
          id: b.id,
          title: b.title,
          slug: b.slug,
          cover_url: b.cover_url,
          author: b.author,
          price_regular: Number(b.price_regular) || 0,
          price_promo: b.price_promo ? Number(b.price_promo) : null,
        });
      }
    }
  }

  return results;
}
