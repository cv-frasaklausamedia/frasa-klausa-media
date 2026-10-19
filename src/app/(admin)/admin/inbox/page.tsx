import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Inbox } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { UnderDevelopment } from '@/components/admin/under-development';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Kotak Masuk Pesan — Admin Frasa Klausa Media',
  description: 'Kelola pesan pertanyaan pembaca, tawaran kerja sama, dan pengajuan naskah dari form kontak publik.',
};

async function InboxContent() {
  await connection();
  await requireAdmin();

  return (
    <UnderDevelopment
      title="Kotak Masuk Pesan & Inquiry"
      description="Pantau dan tindak lanjuti pesan masuk, pertanyaan pembaca, penawaran naskah, dan kerja sama penerbitan dari form kontak publik."
      icon={Inbox}
      estimatedPhase="Tahap 7 — Manajemen Pesan Kontak & Inquiry Publik"
      plannedFeatures={[
        'Penyimpanan terpusat seluruh pesan masuk dari formulir kontak publik ke tabel contact_inquiries',
        'Kategorisasi status penanganan: Belum Dibaca (unread), Telah Dibalas (replied), dan Diarsipkan (archived)',
        'Filter pesan cepat berdasarkan status tindak lanjut, pencarian nama pengirim, atau subjek pesan',
        'Tampilan modal detail pesan lengkap beserta email, nomor telepon WhatsApp, dan riwayat waktu kirim',
        'Tombol aksi responsif: Balas langsung ke email pengirim atau tandai selesai diproses',
        'Pencegahan spam otomatis: terintegrasi dengan modular rate limiter IP dan honeypot di sisi publik',
      ]}
    />
  );
}

export default function AdminInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
