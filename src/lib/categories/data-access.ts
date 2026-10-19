import 'server-only';
import { connection } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type {
  BookCategoryItem,
  CategoryListResponse,
  CategoryFormInput,
  CategoryQueryParams,
} from './types';

/**
 * Sanitasi string pencarian agar tidak merusak filter ILIKE atau PostgREST syntax
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[%_\\]/g, '') // Hapus wildcard SQL
    .replace(/[,()]/g, ' ') // Hapus pemisah klausa PostgREST
    .trim();
}

interface RawCategoryDbRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  books?: { count: number }[] | { count: number } | null;
}

/**
 * Memetakan baris kategori dari Supabase ke DTO BookCategoryItem
 */
function mapCategoryRow(row: RawCategoryDbRow): BookCategoryItem {
  let bookCount = 0;
  if (Array.isArray(row.books) && row.books.length > 0) {
    bookCount = Number(row.books[0]?.count) || 0;
  } else if (row.books && typeof row.books === 'object' && 'count' in row.books) {
    bookCount = Number(row.books.count) || 0;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    book_count: bookCount,
  };
}

/**
 * Mengambil daftar kategori buku dengan pagination, sorting allowlist, dan filter pencarian
 */
export async function getCategoryList(
  params: CategoryQueryParams
): Promise<CategoryListResponse> {
  await connection();
  const supabase = await createClient();
  const { page, pageSize, q, sort } = params;

  let query = supabase
    .from('book_categories')
    .select(
      'id, name, slug, description, seo_title, seo_description, created_at, updated_at, books(count)',
      { count: 'exact' }
    );

  // Filter pencarian pada kolom name, slug, dan description
  const cleanQ = sanitizeSearchQuery(q);
  if (cleanQ) {
    query = query.or(
      `name.ilike.%${cleanQ}%,slug.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`
    );
  }

  // Pengurutan berdasarkan allowlist
  switch (sort) {
    case 'created_at_asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('name', { ascending: false });
      break;
    case 'created_at_desc':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Hitung range pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getCategoryList] Database error:', error);
    throw error;
  }

  let items = (data || []).map(mapCategoryRow);

  // Sort khusus untuk agregasi books count di tingkat halaman bila diminta
  if (sort === 'books_desc') {
    items = items.sort((a, b) => b.book_count - a.book_count);
  } else if (sort === 'books_asc') {
    items = items.sort((a, b) => a.book_count - b.book_count);
  }

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items,
    totalCount,
    page,
    pageSize,
    pageCount,
  };
}

/**
 * Mengambil data kategori berdasarkan ID beserta jumlah buku terkait
 */
export async function getCategoryById(id: string): Promise<BookCategoryItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('book_categories')
    .select(
      'id, name, slug, description, seo_title, seo_description, created_at, updated_at, books(count)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getCategoryById] Database error:', error);
    throw error;
  }

  if (!data) return null;
  return mapCategoryRow(data);
}

/**
 * Mengambil data kategori berdasarkan slug unik
 */
export async function getCategoryBySlug(slug: string): Promise<BookCategoryItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('book_categories')
    .select(
      'id, name, slug, description, seo_title, seo_description, created_at, updated_at, books(count)'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[getCategoryBySlug] Database error:', error);
    throw error;
  }

  if (!data) return null;
  return mapCategoryRow(data);
}

/**
 * Memeriksa apakah suatu slug sudah digunakan oleh kategori lain (pengecekan konflik 409)
 */
export async function checkCategorySlugConflict(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from('book_categories')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[checkCategorySlugConflict] Database error:', error);
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * Mengambil jumlah buku yang masih terasosiasi dengan kategori tertentu (guard relasi)
 */
export async function getCategoryBookCount(categoryId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    console.error('[getCategoryBookCount] Database error:', error);
    throw error;
  }

  return count ?? 0;
}

/**
 * Menambahkan data kategori baru (eksplisit kolom tanpa select * )
 */
export async function insertCategory(
  data: CategoryFormInput
): Promise<BookCategoryItem> {
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from('book_categories')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
    })
    .select('id, name, slug, description, seo_title, seo_description, created_at, updated_at')
    .single();

  if (error) {
    console.error('[insertCategory] Database error:', error);
    throw error;
  }

  return {
    ...created,
    book_count: 0,
  };
}

/**
 * Memperbarui data kategori yang sudah ada
 */
export async function updateCategory(
  id: string,
  data: CategoryFormInput
): Promise<BookCategoryItem> {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('book_categories')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, name, slug, description, seo_title, seo_description, created_at, updated_at')
    .single();

  if (error) {
    console.error('[updateCategory] Database error:', error);
    throw error;
  }

  const bookCount = await getCategoryBookCount(id);

  return {
    ...updated,
    book_count: bookCount,
  };
}

/**
 * Menghapus baris kategori buku
 */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('book_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteCategory] Database error:', error);
    throw error;
  }
}
