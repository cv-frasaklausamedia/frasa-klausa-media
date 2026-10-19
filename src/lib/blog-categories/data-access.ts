import 'server-only';
import { connection } from 'next/server';

import { createClient, createPublicClient } from '@/lib/supabase/server';
import type {
  BlogCategoryItem,
  BlogCategoryListResponse,
  BlogCategoryFormInput,
  BlogCategoryQueryParams,
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

interface RawBlogCategoryDbRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  posts?: { count: number }[] | { count: number } | null;
}

/**
 * Memetakan baris kategori blog dari Supabase ke DTO BlogCategoryItem
 */
function mapBlogCategoryRow(row: RawBlogCategoryDbRow): BlogCategoryItem {
  let postCount = 0;
  if (Array.isArray(row.posts) && row.posts.length > 0) {
    postCount = Number(row.posts[0]?.count) || 0;
  } else if (row.posts && typeof row.posts === 'object' && 'count' in row.posts) {
    postCount = Number(row.posts.count) || 0;
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
    post_count: postCount,
  };
}

/**
 * Mengambil daftar kategori blog dengan pagination, sorting allowlist, dan filter pencarian
 */
export async function getBlogCategoryList(
  params: BlogCategoryQueryParams
): Promise<BlogCategoryListResponse> {
  await connection();
  const supabase = await createClient();
  const { page, pageSize, q, sort } = params;

  let query = supabase
    .from('blog_categories')
    .select(
      'id, name, slug, description, seo_title, seo_description, created_at, updated_at, posts(count)',
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
    console.error('[getBlogCategoryList] Database error:', error);
    throw error;
  }

  let items = (data || []).map(mapBlogCategoryRow);

  // Sort khusus untuk agregasi posts count di tingkat halaman bila diminta
  if (sort === 'posts_desc') {
    items = items.sort((a, b) => b.post_count - a.post_count);
  } else if (sort === 'posts_asc') {
    items = items.sort((a, b) => a.post_count - b.post_count);
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
 * Mengambil data kategori blog berdasarkan ID beserta jumlah artikel terkait
 */
export async function getBlogCategoryById(id: string): Promise<BlogCategoryItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blog_categories')
    .select(
      'id, name, slug, description, seo_title, seo_description, created_at, updated_at, posts(count)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getBlogCategoryById] Database error:', error);
    throw error;
  }

  if (!data) return null;
  return mapBlogCategoryRow(data);
}

/**
 * Mengambil data kategori blog berdasarkan slug unik
 */
export async function getBlogCategoryBySlug(slug: string): Promise<BlogCategoryItem | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('blog_categories')
    .select(
      'id, name, slug, description, seo_title, seo_description, created_at, updated_at, posts(count)'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[getBlogCategoryBySlug] Database error:', error);
    throw error;
  }

  if (!data) return null;
  return mapBlogCategoryRow(data);
}

/**
 * Memeriksa apakah suatu slug sudah digunakan oleh kategori blog lain (pengecekan konflik 409)
 */
export async function checkBlogCategorySlugConflict(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from('blog_categories')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[checkBlogCategorySlugConflict] Database error:', error);
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * Mengambil jumlah artikel blog yang masih terasosiasi dengan kategori tertentu (guard relasi ON DELETE RESTRICT)
 */
export async function getBlogCategoryPostCount(categoryId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    console.error('[getBlogCategoryPostCount] Database error:', error);
    throw error;
  }

  return count ?? 0;
}

/**
 * Menambahkan data kategori blog baru
 */
export async function insertBlogCategory(
  data: BlogCategoryFormInput
): Promise<BlogCategoryItem> {
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from('blog_categories')
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
    console.error('[insertBlogCategory] Database error:', error);
    throw error;
  }

  return {
    ...created,
    post_count: 0,
  };
}

/**
 * Memperbarui data kategori blog
 */
export async function updateBlogCategory(
  id: string,
  data: BlogCategoryFormInput
): Promise<BlogCategoryItem> {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('blog_categories')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
    })
    .eq('id', id)
    .select('id, name, slug, description, seo_title, seo_description, created_at, updated_at')
    .single();

  if (error) {
    console.error('[updateBlogCategory] Database error:', error);
    throw error;
  }

  const postCount = await getBlogCategoryPostCount(id);

  return {
    ...updated,
    post_count: postCount,
  };
}

/**
 * Menghapus kategori blog dari basis data
 */
export async function deleteBlogCategory(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteBlogCategory] Database error:', error);
    throw error;
  }
}

/**
 * Mengambil semua kategori blog untuk pilihan dropdown form
 */
export async function getAllBlogCategories(): Promise<
  Array<{ id: string; name: string; slug: string }>
> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    console.error('[getAllBlogCategories] Database error:', error);
    throw error;
  }

  return data ?? [];
}
