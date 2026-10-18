import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { OFFICIAL_IDENTITY } from '@/constants';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="font-semibold text-foreground">
            CMS Admin — {OFFICIAL_IDENTITY.COMPANY_NAME}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild size="sm" variant="ghost" className="gap-1.5">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Ke Situs
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
