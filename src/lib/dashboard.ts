import { createClient } from '@/lib/supabase/server';
import { getSystemSettingsRecord } from '@/lib/settings/data-access';

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

export interface RecentBookItem {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  author: string;
  priceRegular: number;
  pricePromo: number | null;
  isPublished: boolean;
  categoryName: string;
  createdAt: string;
}

export interface RecentInquiryItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: 'unread' | 'replied' | 'archived';
  createdAt: string;
}

export interface ActiveBannerItem {
  id: string;
  message: string;
  linkUrl: string | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface AdminDashboardData {
  metrics: DashboardMetrics;
  chartData: CategoryBookCount[];
  recentBooks: RecentBookItem[];
  recentInquiries: RecentInquiryItem[];
  activeBanners: ActiveBannerItem[];
}

export interface RecentAuditLogItem {
  id: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  status: 'success' | 'failure';
  createdAt: string;
  ipAddress: string | null;
}

export interface SuperAdminAccountSummary {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
}

export interface SuperAdminDashboardData {
  metrics: {
    totalAdmins: number;
    activeAdmins: number;
    superAdmins: number;
    totalBooks: number;
    totalPosts: number;
    unreadInquiries: number;
    totalAuditLogs: number;
  };
  recentAuditLogs: RecentAuditLogItem[];
  recentAccounts: SuperAdminAccountSummary[];
  systemStatus: {
    database: 'online' | 'degraded';
    keepAliveActive: boolean;
    maintenanceMode: boolean;
    publicRegistration: boolean;
    marketplaceRedirect: boolean;
    whatsappNumber: string;
  };
  adminOverview: AdminDashboardData;
}

/**
 * Mengambil ringkasan metrik dashboard secara efisien di server.
 * Menggunakan count: 'exact' dan head: true tanpa memuat baris data.
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

  const { data: categories } = await supabase
    .from('book_categories')
    .select('id, name')
    .order('name', { ascending: true });

  const categoryList = (categories ?? []) as Array<{ id: string; name: string }>;

  if (categoryList.length === 0) {
    return [];
  }

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

/**
 * Mengambil seluruh data yang dibutuhkan oleh tampilan Dashboard Admin (Role: admin)
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  const [metrics, chartData, booksRes, inquiriesRes, bannersRes] = await Promise.all([
    getDashboardMetrics(),
    getBooksPerCategoryStats(),
    supabase
      .from('books')
      .select('id, title, slug, cover_url, author, price_regular, price_promo, is_published, created_at, book_categories(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('contact_inquiries')
      .select('id, name, email, subject, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('banners')
      .select('id, message, link_url, is_active, starts_at, ends_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const recentBooks: RecentBookItem[] = (booksRes.data || []).map((b) => {
    const cat = Array.isArray(b.book_categories)
      ? b.book_categories[0]
      : b.book_categories;

    return {
      id: b.id,
      title: b.title,
      slug: b.slug,
      coverUrl: b.cover_url,
      author: b.author,
      priceRegular: b.price_regular,
      pricePromo: b.price_promo,
      isPublished: b.is_published,
      categoryName: cat?.name ?? 'Umum',
      createdAt: b.created_at,
    };
  });

  const recentInquiries: RecentInquiryItem[] = (inquiriesRes.data || []).map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    subject: i.subject,
    status: i.status as 'unread' | 'replied' | 'archived',
    createdAt: i.created_at,
  }));

  const activeBanners: ActiveBannerItem[] = (bannersRes.data || []).map((b) => ({
    id: b.id,
    message: b.message,
    linkUrl: b.link_url,
    isActive: b.is_active,
    startDate: b.starts_at,
    endDate: b.ends_at,
  }));

  return {
    metrics,
    chartData,
    recentBooks,
    recentInquiries,
    activeBanners,
  };
}

/**
 * Mengambil seluruh data yang dibutuhkan oleh tampilan Dashboard Super Admin (Role: super_admin)
 */
export async function getSuperAdminDashboardData(): Promise<SuperAdminDashboardData> {
  const supabase = await createClient();

  const [
    adminOverview,
    totalAdminsRes,
    activeAdminsRes,
    superAdminsRes,
    auditCountRes,
    auditLogsRes,
    recentProfilesRes,
    systemSettings,
  ] = await Promise.all([
    getAdminDashboardData(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin').eq('is_active', true),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
    supabase
      .from('audit_logs')
      .select('id, action, target_type, status, ip_address, created_at, actor:profiles(full_name, email, role)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    getSystemSettingsRecord().catch(() => null),
  ]);

  const recentAuditLogs: RecentAuditLogItem[] = (auditLogsRes.data || []).map((row) => {
    const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
    return {
      id: row.id,
      actorName: actor?.full_name ?? 'Sistem / Anonim',
      actorEmail: actor?.email ?? '-',
      actorRole: actor?.role ?? 'system',
      action: row.action,
      targetType: row.target_type,
      status: (row.status === 'failure' ? 'failure' : 'success') as 'success' | 'failure',
      createdAt: row.created_at,
      ipAddress: row.ip_address,
    };
  });

  const recentAccounts: SuperAdminAccountSummary[] = (recentProfilesRes.data || []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email ?? '-',
    role: p.role as 'admin' | 'super_admin',
    isActive: p.is_active,
    createdAt: p.created_at,
  }));

  return {
    metrics: {
      totalAdmins: totalAdminsRes.count ?? 0,
      activeAdmins: activeAdminsRes.count ?? 0,
      superAdmins: superAdminsRes.count ?? 0,
      totalBooks: adminOverview.metrics.totalBooks,
      totalPosts: adminOverview.metrics.totalPosts,
      unreadInquiries: adminOverview.metrics.unreadInquiries,
      totalAuditLogs: auditCountRes.count ?? 0,
    },
    recentAuditLogs,
    recentAccounts,
    systemStatus: {
      database: 'online',
      keepAliveActive: true,
      maintenanceMode: systemSettings?.features?.maintenance_mode ?? false,
      publicRegistration: systemSettings?.features?.enable_public_registration ?? false,
      marketplaceRedirect: systemSettings?.features?.enable_marketplace_redirect ?? true,
      whatsappNumber: systemSettings?.general?.contact_whatsapp ?? '0813-8060-4256',
    },
    adminOverview,
  };
}
