import { Suspense } from 'react';
import { UserCheck } from 'lucide-react';
import { ProfileContent } from './_components/profile-content';
import AdminProfileLoading from './loading';

export const metadata = {
  title: 'Profil Pengguna — Admin Frasa Klausa Media',
};

export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Profil Pengguna
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data identitas akun, foto profil, dan kredensial keamanan Anda.
          </p>
        </div>
      </div>

      <Suspense fallback={<AdminProfileLoading />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
