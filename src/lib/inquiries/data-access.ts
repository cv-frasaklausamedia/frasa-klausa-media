import 'server-only';
import { connection } from 'next/server';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import type { InquiryQueryParams, ContactInquiryValues } from '@/validations/inquiry';
import type { InquiryItem, InquiryListResponse, InquiryMetrics } from './types';
import type { InquiryStatus } from '@/types/database';

function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[%_\\]/g, '')
    .replace(/[,()]/g, ' ')
    .trim();
}

/**
 * Menyimpan pesan kontak masuk baru dari publik ke tabel contact_inquiries.
 * Menggunakan status default 'unread' per PRD §6.3.7.
 */
export async function createInquiryRecord(
  data: Omit<ContactInquiryValues, 'hp_field'>
): Promise<{ id: string }> {
  const supabase = createPublicClient();
  const id = crypto.randomUUID();

  const { error } = await supabase
    .from('contact_inquiries')
    .insert({
      id,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject,
      message: data.message,
      status: 'unread',
    });

  if (error) {
    console.error('[createInquiryRecord] Gagal menyimpan pesan:', error);
    throw error;
  }

  return { id };
}

/**
 * Mengambil daftar pesan kontak masuk untuk dashboard admin terpaginasi.
 * Terproteksi RLS Supabase (hanya is_active_admin).
 */
export async function getAdminInquiries(
  params: InquiryQueryParams
): Promise<InquiryListResponse> {
  await connection();
  const supabase = await createClient();

  const { page, pageSize, status, q } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('contact_inquiries')
    .select('id, name, email, phone, subject, message, status, created_at', {
      count: 'exact',
    });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (q && q.trim()) {
    const cleanQ = sanitizeSearchQuery(q);
    if (cleanQ) {
      query = query.or(
        `name.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%,subject.ilike.%${cleanQ}%`
      );
    }
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getAdminInquiries] Error:', error);
    throw new Error(`Gagal memuat pesan: ${error.message}`);
  }

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const items = (data || []) as InquiryItem[];

  return {
    items,
    totalCount,
    page,
    pageSize,
    pageCount,
  };
}

/**
 * Mengambil detail pesan tunggal berdasarkan ID
 */
export async function getInquiryById(id: string): Promise<InquiryItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contact_inquiries')
    .select('id, name, email, phone, subject, message, status, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getInquiryById] Error:', error);
    throw new Error(`Gagal memuat pesan: ${error.message}`);
  }

  return (data as InquiryItem) || null;
}

/**
 * Memperbarui status pesan (unread, replied, archived) oleh admin
 */
export async function updateInquiryStatusRecord(
  id: string,
  status: InquiryStatus
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('contact_inquiries')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('[updateInquiryStatusRecord] Error:', error);
    throw new Error(`Gagal memperbarui status pesan: ${error.message}`);
  }
}

/**
 * Menghapus pesan kontak dari basis data oleh admin
 */
export async function deleteInquiryRecord(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('contact_inquiries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteInquiryRecord] Error:', error);
    throw new Error(`Gagal menghapus pesan: ${error.message}`);
  }
}

/**
 * Menghitung metrik pesan untuk badge ringkasan admin
 */
export async function getInquiriesMetrics(): Promise<InquiryMetrics> {
  await connection();
  const supabase = await createClient();

  const [totalRes, unreadRes, repliedRes, archivedRes] = await Promise.all([
    supabase.from('contact_inquiries').select('*', { count: 'exact', head: true }),
    supabase
      .from('contact_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread'),
    supabase
      .from('contact_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'replied'),
    supabase
      .from('contact_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'archived'),
  ]);

  return {
    totalCount: totalRes.count ?? 0,
    unreadCount: unreadRes.count ?? 0,
    repliedCount: repliedRes.count ?? 0,
    archivedCount: archivedRes.count ?? 0,
  };
}
