import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, ShieldCheck, User } from 'lucide-react';
import type { SuperAdminAccountSummary } from '@/lib/dashboard';

interface RecentAccountsCardProps {
  accounts: SuperAdminAccountSummary[];
}

export function RecentAccountsCard({ accounts }: RecentAccountsCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary shrink-0" />
            Pengelola Akun CMS
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Daftar tim administrator terdaftar pada sistem
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1 text-primary hover:text-primary">
          <Link href="/admin/users">
            Kelola Akun <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="divide-y divide-border/60">
          {accounts.map((acc) => {
            const isSuper = acc.role === 'super_admin';
            return (
              <div
                key={acc.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 -mx-2 px-2 rounded-md hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSuper
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-muted text-foreground ring-1 ring-border'
                    }`}
                  >
                    {isSuper ? <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {acc.fullName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {acc.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={isSuper ? 'default' : 'secondary'}
                    className={`text-[9px] px-1.5 py-0 font-normal ${
                      isSuper
                        ? 'bg-amber-600 hover:bg-amber-600 text-white dark:bg-amber-600'
                        : ''
                    }`}
                  >
                    {isSuper ? 'Super Admin' : 'Admin'}
                  </Badge>
                  <Badge
                    variant={acc.isActive ? 'outline' : 'destructive'}
                    className={`text-[9px] px-1.5 py-0 font-normal ${
                      acc.isActive
                        ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : ''
                    }`}
                  >
                    {acc.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
