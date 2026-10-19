import 'server-only';
import { connection } from 'next/server';

import { createClient, createPublicClient } from '@/lib/supabase/server';
import type {
  PostQueryParams,
  PublicBlogQueryParams,
  PostFormValues,
  PostStatus,
} from '@/validations/post';
import type {
  PostListItem,
  PostListResponse,
  PostDetail,
  BlogCategoryOption,
} from './types';

/**
 * Sanitasi query pencarian agar tidak merusak filter ILIKE atau PostgREST syntax
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[%_\\]/g, '') // Hapus wildcard SQL
    .replace(/[,()]/g, ' ') // Hapus pemisah klausa PostgREST
    .trim();
}

/**
 * Kolom eksplisit tabel posts untuk tampilan daftar admin
 */
const POST_LIST_SELECT_COLUMNS = `
  id,
  title,
  slug,
  excerpt,
  cover_url,
  author_name,
  category_id,
  status,
  published_at,
  reading_time_minutes,
  tags,
  created_at,
  updated_at,
  blog_categories (
    id,
    name,
    slug
  )
` as const;

/**
 * Kolom eksplisit tabel posts untuk tampilan detail
 */
const POST_DETAIL_SELECT_COLUMNS = `
  id,
  title,
  slug,
  excerpt,
  content,
  cover_url,
  author_name,
  author_id,
  category_id,
  status,
  published_at,
  reading_time_minutes,
  tags,
  seo_title,
  seo_description,
  created_at,
  updated_at,
  blog_categories (
    id,
    name,
    slug
  )
` as const;

interface RawPostListRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string | null;
  author_name: string;
  category_id: string;
  status: PostStatus;
  published_at: string | null;
  reading_time_minutes: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  blog_categories: { id: string; name: string; slug: string } | null;
}

interface RawPostDetailRow extends RawPostListRow {
  content: string;
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

function mapRawPostToListItem(row: RawPostListRow): PostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    cover_url: row.cover_url || null,
    author_name: row.author_name,
    category_id: row.category_id,
    category_name: row.blog_categories?.name || 'Tanpa Kategori',
    category_slug: row.blog_categories?.slug || '',
    status: row.status,
    published_at: row.published_at || null,
    reading_time_minutes: row.reading_time_minutes || 1,
    tags: Array.isArray(row.tags) ? row.tags : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRawPostToDetail(row: RawPostDetailRow): PostDetail {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content || '',
    cover_url: row.cover_url || null,
    author_name: row.author_name,
    author_id: row.author_id || null,
    category_id: row.category_id,
    status: row.status,
    published_at: row.published_at || null,
    reading_time_minutes: row.reading_time_minutes || 1,
    tags: Array.isArray(row.tags) ? row.tags : [],
    seo_title: row.seo_title || null,
    seo_description: row.seo_description || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.blog_categories
      ? {
          id: row.blog_categories.id,
          name: row.blog_categories.name,
          slug: row.blog_categories.slug,
        }
      : null,
  };
}

// ============================================================================
// QUERY DATA ACCESS (SERVER-ONLY)
// ============================================================================

/**
 * Mengambil daftar artikel blog untuk tabel admin dengan filter, pencarian, dan pagination
 */
export async function getAdminPosts(queryParams: PostQueryParams): Promise<PostListResponse> {
  const supabase = await createClient();
  const { page, pageSize, q, category_id, status, sort } = queryParams;

  let query = supabase
    .from('posts')
    .select(POST_LIST_SELECT_COLUMNS, { count: 'exact' });

  // 1. Filter Pencarian Text (Judul, Ringkasan, Penulis)
  if (q && q.trim().length > 0) {
    const cleanQ = sanitizeSearchQuery(q);
    if (cleanQ) {
      query = query.or(
        `title.ilike.%${cleanQ}%,excerpt.ilike.%${cleanQ}%,author_name.ilike.%${cleanQ}%`
      );
    }
  }

  // 2. Filter Kategori Blog
  if (category_id && category_id !== 'all') {
    query = query.eq('category_id', category_id);
  }

  // 3. Filter Status (Draft, Published, Scheduled)
  const nowIso = new Date().toISOString();
  if (status === 'draft') {
    query = query.eq('status', 'draft');
  } else if (status === 'published') {
    query = query.eq('status', 'published').lte('published_at', nowIso);
  } else if (status === 'scheduled') {
    query = query.eq('status', 'published').gt('published_at', nowIso);
  }

  // 4. Pengurutan (Sorting)
  switch (sort) {
    case 'created_at_asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'published_at_desc':
      query = query.order('published_at', { ascending: false, nullsFirst: false });
      break;
    case 'published_at_asc':
      query = query.order('published_at', { ascending: true, nullsFirst: false });
      break;
    case 'title_asc':
      query = query.order('title', { ascending: true });
      break;
    case 'title_desc':
      query = query.order('title', { ascending: false });
      break;
    case 'created_at_desc':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // 5. Paginasi Range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getAdminPosts] Database error:', error);
    throw error;
  }

  const totalCount = count ?? 0;
  const pageCount = Math.ceil(totalCount / pageSize) || 1;
  const items = ((data as unknown as RawPostListRow[]) || []).map(mapRawPostToListItem);

  return {
    items,
    totalCount,
    page,
    pageSize,
    pageCount,
  };
}

/**
 * Mengambil detail artikel berdasarkan ID (digunakan untuk edit & pratinjau admin)
 */
export async function getPostById(id: string): Promise<PostDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .select(POST_DETAIL_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getPostById] Database error:', error);
    throw error;
  }

  if (!data) return null;
  return mapRawPostToDetail(data as unknown as RawPostDetailRow);
}

/**
 * Mengambil detail artikel publik berdasarkan slug.
 * Pertahanan ganda: RLS Supabase + klausa eksplisit status='published' AND published_at <= now().
 * Artikel draf atau terjadwal di masa depan AKAN mengembalikan null (404 Not Found) untuk publik anon.
 */
export async function getPublicPostBySlug(slug: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('posts')
    .select(POST_DETAIL_SELECT_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', nowIso)
    .maybeSingle();

  if (error) {
    console.error('[getPublicPostBySlug] Error:', error);
    return null;
  }

  if (!data) return null;
  return mapRawPostToDetail(data as unknown as RawPostDetailRow);
}

/**
 * Memeriksa apakah slug artikel sudah terdaftar pada record lain (pencegahan duplikasi 409)
 */
export async function checkPostSlugConflict(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase.from('posts').select('id', { head: true, count: 'exact' }).eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count, error } = await query;
  if (error) {
    console.error('[checkPostSlugConflict] Error:', error);
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * Mengambil opsi kategori blog untuk select dropdown
 */
export async function getBlogCategoriesOptions(): Promise<BlogCategoryOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    console.error('[getBlogCategoriesOptions] Error:', error);
    return [];
  }

  return (data as BlogCategoryOption[]) || [];
}

/**
 * Membuat record artikel baru
 */
export async function createPostRecord(
  data: PostFormValues,
  readingTimeMinutes: number,
  authorId: string
): Promise<string> {
  const supabase = await createClient();

  // Jika status published dan published_at tidak dispesifikasikan, gunakan waktu saat ini
  const publishedAt =
    data.status === 'published'
      ? data.published_at || new Date().toISOString()
      : data.published_at || null;

  const { data: inserted, error } = await supabase
    .from('posts')
    .insert({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || '',
      content: data.content,
      cover_url: data.cover_url || null,
      category_id: data.category_id,
      author_name: data.author_name,
      author_id: authorId,
      status: data.status,
      published_at: publishedAt,
      reading_time_minutes: readingTimeMinutes,
      tags: data.tags || [],
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[createPostRecord] Error inserting post:', error);
    throw error;
  }

  return inserted.id;
}

/**
 * Memperbarui record artikel yang sudah ada
 */
export async function updatePostRecord(
  id: string,
  data: PostFormValues,
  readingTimeMinutes: number
): Promise<string> {
  const supabase = await createClient();

  const publishedAt =
    data.status === 'published'
      ? data.published_at || new Date().toISOString()
      : data.published_at || null;

  const { error } = await supabase
    .from('posts')
    .update({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || '',
      content: data.content,
      cover_url: data.cover_url || null,
      category_id: data.category_id,
      author_name: data.author_name,
      status: data.status,
      published_at: publishedAt,
      reading_time_minutes: readingTimeMinutes,
      tags: data.tags || [],
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[updatePostRecord] Error updating post:', error);
    throw error;
  }

  return id;
}

/**
 * Menghapus record artikel dan mengembalikan cover_url serta content untuk keperluan pembersihan storage
 */
export async function deletePostRecord(id: string): Promise<{
  id: string;
  coverUrl: string | null;
  content: string;
}> {
  const supabase = await createClient();

  // Ambil data cover_url dan content sebelum menghapus
  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('id, cover_url, content')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    console.error('[deletePostRecord] Post not found:', fetchError);
    throw new Error('Artikel tidak ditemukan.');
  }

  const { error: deleteError } = await supabase.from('posts').delete().eq('id', id);

  if (deleteError) {
    console.error('[deletePostRecord] Delete error:', deleteError);
    throw deleteError;
  }

  return {
    id: existing.id,
    coverUrl: existing.cover_url,
    content: existing.content || '',
  };
}

/**
 * Memperbarui status publikasi artikel secara cepat dari tabel
 */
export async function togglePostStatusRecord(id: string, status: PostStatus): Promise<void> {
  const supabase = await createClient();

  const updatePayload: {
    status: PostStatus;
    published_at?: string | null;
    updated_at: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Jika diubah ke published, pastikan published_at terisi jika sebelumnya kosong
  if (status === 'published') {
    const { data: existing } = await supabase
      .from('posts')
      .select('published_at')
      .eq('id', id)
      .single();

    if (!existing?.published_at) {
      updatePayload.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase.from('posts').update(updatePayload).eq('id', id);

  if (error) {
    console.error('[togglePostStatusRecord] Error:', error);
    throw error;
  }
}

/**
 * Memeriksa apakah path storage sedang dipakai oleh artikel lain di database
 * (di kolom cover_url ATAU di dalam teks content)
 */
export async function isBlogStoragePathInUse(
  path: string,
  excludePostId?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Cek penggunaan di cover_url
  let coverQuery = supabase
    .from('posts')
    .select('id', { head: true, count: 'exact' })
    .ilike('cover_url', `%${path}%`);

  if (excludePostId) {
    coverQuery = coverQuery.neq('id', excludePostId);
  }

  const { count: coverCount, error: coverError } = await coverQuery;
  if (!coverError && (coverCount ?? 0) > 0) {
    return true;
  }

  // Cek penggunaan di content
  let contentQuery = supabase
    .from('posts')
    .select('id', { head: true, count: 'exact' })
    .ilike('content', `%${path}%`);

  if (excludePostId) {
    contentQuery = contentQuery.neq('id', excludePostId);
  }

  const { count: contentCount, error: contentError } = await contentQuery;
  if (!contentError && (contentCount ?? 0) > 0) {
    return true;
  }

  return false;
}

/**
 * Mengambil daftar artikel blog terbaru yang telah terpublikasi untuk Beranda publik
 */
export async function getPublicLatestPosts(limit = 3): Promise<PostListItem[]> {
  await connection();
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('posts')
    .select(POST_LIST_SELECT_COLUMNS)
    .eq('status', 'published')
    .lte('published_at', nowIso)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getPublicLatestPosts] Error:', error);
    return [];
  }

  return ((data as unknown as RawPostListRow[]) || []).map(mapRawPostToListItem);
}

/**
 * Mengambil daftar artikel blog publik dengan filter kategori, pencarian, dan paginasi server-side.
 * Hanya artikel dengan status='published' dan published_at <= now() yang dikembalikan (PRD §6.3.5 & US-06).
 */
export async function getPublicPosts(
  queryParams: PublicBlogQueryParams
): Promise<PostListResponse> {
  await connection();
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();

  const { page, pageSize, q, kategori, sort } = queryParams;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('posts')
    .select(POST_LIST_SELECT_COLUMNS, { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', nowIso);

  // Filter Kategori (mencocokkan slug atau ID)
  if (kategori) {
    const { data: catData } = await supabase
      .from('blog_categories')
      .select('id')
      .or(`slug.eq.${kategori},id.eq.${kategori}`)
      .maybeSingle();

    if (catData?.id) {
      query = query.eq('category_id', catData.id);
    } else {
      return {
        items: [],
        totalCount: 0,
        page,
        pageSize,
        pageCount: 0,
      };
    }
  }

  // Filter Pencarian Teks
  if (q && q.trim()) {
    const cleanQ = sanitizeSearchQuery(q);
    if (cleanQ) {
      query = query.or(`title.ilike.%${cleanQ}%,excerpt.ilike.%${cleanQ}%`);
    }
  }

  // Pengurutan
  switch (sort) {
    case 'published_at_asc':
      query = query.order('published_at', { ascending: true });
      break;
    case 'title_asc':
      query = query.order('title', { ascending: true });
      break;
    case 'title_desc':
      query = query.order('title', { ascending: false });
      break;
    case 'published_at_desc':
    default:
      query = query.order('published_at', { ascending: false });
      break;
  }

  // Paginasi range
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getPublicPosts] Error:', error);
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
      pageCount: 0,
    };
  }

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const items = ((data as unknown as RawPostListRow[]) || []).map(mapRawPostToListItem);

  return {
    items,
    totalCount,
    page,
    pageSize,
    pageCount,
  };
}

/**
 * Mengambil artikel terkait (kategori yang sama) untuk halaman detail artikel publik.
 */
export async function getPublicRelatedPosts(
  postId: string,
  categoryId: string,
  limit = 3
): Promise<PostListItem[]> {
  await connection();
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('posts')
    .select(POST_LIST_SELECT_COLUMNS)
    .eq('status', 'published')
    .lte('published_at', nowIso)
    .eq('category_id', categoryId)
    .neq('id', postId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getPublicRelatedPosts] Error:', error);
    return [];
  }

  return ((data as unknown as RawPostListRow[]) || []).map(mapRawPostToListItem);
}

