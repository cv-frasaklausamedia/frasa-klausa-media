import type { UserRole } from './database';

export interface AdminAccountItem {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountListResponse {
  items: AdminAccountItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  activeCount: number;
  superAdminCount: number;
  activeSuperAdminCount?: number;
}

export type AccountStatusFilter = 'all' | 'active' | 'inactive';
export type AccountRoleFilter = 'all' | 'admin' | 'super_admin';

export interface AccountQueryParams {
  q?: string;
  status?: AccountStatusFilter;
  role?: AccountRoleFilter;
  page?: number;
  pageSize?: number;
  sort?: string;
}
