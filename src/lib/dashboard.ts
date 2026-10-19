import { createClient } from '@/lib/supabase/server';

export interface DashboardMetrics {
  totalBooks: number;
  totalCategories: number;
  totalPosts: number;
  activeBanners: number;
  unreadInquiries: number;
}

export interface CategoryBookCount {
  name: string;
  count: number;
}

/**
 * Mengambil ringkasan metrik dashboard secara efisien di server.
 * Menggunakan count: 'exact' dan head: true tanpa memuat baris data (tanpa SELECT *).
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [booksRes, categoriesRes, postsRes, bannersRes, inquiriesRes] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('book_categories').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('contact_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
  ]);

  return {
    totalBooks: booksRes.count ?? 0,
    totalCategories: categoriesRes.count ?? 0,
    totalPosts: postsRes.count ?? 0,
    activeBanners: bannersRes.count ?? 0,
    unreadInquiries: inquiriesRes.count ?? 0,
  };
}

/**
 * Mengambil sebaran jumlah buku per kategori untuk divisualisasikan pada chart.
 */
export async function getBooksPerCategoryStats(): Promise<CategoryBookCount[]> {
  const supabase = await createClient();

  // Ambil daftar kategori buku (hanya kolom id dan nama)
  const { data: categories } = await supabase
    .from('book_categories')
    .select('id, name')
    .order('name', { ascending: true });

  const categoryList = (categories ?? []) as Array<{ id: string; name: string }>;

  if (categoryList.length === 0) {
    return [];
  }

  // Hitung jumlah buku per kategori secara paralel dan efisien
  const results = await Promise.all(
    categoryList.map(async (cat) => {
      const { count } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id);

      return {
        name: cat.name,
        count: count ?? 0,
      };
    })
  );

  return results;
}
