import { createClient } from '@/lib/supabase/server';
import type {
  AdminAccountItem,
  AccountListResponse,
  AccountQueryParams,
} from '@/types/accounts';

/**
 * Mengambil daftar akun pengelola CMS dengan pagination, pencarian, dan filter status (PRD §6.1).
 */
export async function getAccountList(
  params: AccountQueryParams = {}
): Promise<AccountListResponse> {
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, is_active, created_at, updated_at', {
      count: 'exact',
    });

  // Pencarian nama atau email
  if (params.q && params.q.trim() !== '') {
    const term = `%${params.q.trim()}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }

  // Filter status aktif/nonaktif
  if (params.status === 'active') {
    query = query.eq('is_active', true);
  } else if (params.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  // Filter peran
  if (params.role === 'admin' || params.role === 'super_admin') {
    query = query.eq('role', params.role);
  }

  // Pengurutan
  if (params.sort === 'created_at_asc') {
    query = query.order('created_at', { ascending: true });
  } else if (params.sort === 'full_name_asc') {
    query = query.order('full_name', { ascending: true });
  } else if (params.sort === 'full_name_desc') {
    query = query.order('full_name', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error('[getAccountList] Error fetching profiles:', error);
    throw new Error('Gagal memuat daftar akun pengelola.');
  }

  // Ambil metrik ringkasan (aktif count & super admin count)
  const [{ count: activeCount }, { count: superAdminCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin'),
  ]);

  const items: AdminAccountItem[] = (data || []).map((row) => ({
    id: row.id,
    email: row.email ?? '',
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const totalCount = count ?? 0;
  const pageCount = Math.ceil(totalCount / pageSize) || 1;

  return {
    items,
    totalCount,
    page,
    pageSize,
    pageCount,
    activeCount: activeCount ?? 0,
    superAdminCount: superAdminCount ?? 0,
    activeSuperAdminCount: superAdminCount ?? 0,
  };
}

/**
 * Mengambil satu data profil pengguna berdasarkan ID
 */
export async function getAccountById(id: string): Promise<AdminAccountItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, is_active, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email ?? '',
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    role: data.role,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Menghitung jumlah Super Admin yang berstatus aktif saat ini di sistem
 */
export async function countActiveSuperAdmins(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'super_admin')
    .eq('is_active', true);

  if (error) {
    console.error('[countActiveSuperAdmins] Error counting active super admins:', error);
    return 1; // Konservatif
  }

  return count ?? 0;
}

/**
 * Memperbarui status is_active pengguna di tabel profiles
 */
export async function updateUserActiveStatus(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
