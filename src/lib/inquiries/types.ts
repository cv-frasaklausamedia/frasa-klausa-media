import type { InquiryStatus } from '@/types/database';

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export interface InquiryListResponse {
  items: InquiryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface InquiryMetrics {
  totalCount: number;
  unreadCount: number;
  repliedCount: number;
  archivedCount: number;
}
