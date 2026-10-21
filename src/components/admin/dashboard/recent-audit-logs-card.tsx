import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, UserCheck, Key, Settings, Clock } from 'lucide-react';
import type { RecentAuditLogItem } from '@/lib/dashboard';

interface RecentAuditLogsCardProps {
  logs: RecentAuditLogItem[];
}

function getActionLabel(action: string): { label: string; icon: React.ComponentType<{ className?: string }> } {
  switch (action) {
    case 'user.create':
      return { label: 'Tambah Admin Baru', icon: UserCheck };
    case 'user.activate':
      return { label: 'Aktivasi Akun Admin', icon: ShieldCheck };
    case 'user.deactivate':
      return { label: 'Nonaktifkan Akun Admin', icon: ShieldAlert };
    case 'user.reset_password':
      return { label: 'Reset Kata Sandi Admin', icon: Key };
    case 'settings.update':
      return { label: 'Pembaruan Pengaturan Sistem', icon: Settings };
    default:
      return { label: action, icon: Settings };
  }
}

function formatWibDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB';
  } catch {
    return dateStr;
  }
}

export function RecentAuditLogsCard({ logs }: RecentAuditLogsCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              Audit Trail Keamanan Terkini
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Rekaman append-only aksi administratif sensitif pada platform
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit text-[11px] font-mono border-primary/40 text-primary">
            Immutable Log
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border p-4 bg-muted/20">
            <Clock className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium text-foreground">Belum ada rekaman audit log</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Setiap penambahan admin, pengubahan status, dan pengaturan akan tercatat otomatis di sini
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {logs.map((log) => {
              const { label, icon: ActionIcon } = getActionLabel(log.action);
              const isSuccess = log.status === 'success';

              return (
                <div
                  key={log.id}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 -mx-2 px-2 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {label}
                        </span>
                        <Badge
                          variant={isSuccess ? 'outline' : 'destructive'}
                          className={`text-[9px] px-1.5 py-0 font-normal leading-tight ${
                            isSuccess
                              ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : ''
                          }`}
                        >
                          {isSuccess ? 'Berhasil' : 'Gagal'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        Oleh: <span className="font-medium text-foreground/90">{log.actorName}</span>{' '}
                        {log.actorEmail !== '-' && `(${log.actorEmail})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pl-11 sm:pl-0">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {formatWibDate(log.createdAt)}
                    </span>
                    {log.ipAddress && (
                      <span className="text-[10px] font-mono text-muted-foreground/70">
                        IP: {log.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
