import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Inbox, ArrowRight, Mail } from 'lucide-react';
import type { RecentInquiryItem } from '@/lib/dashboard';

interface RecentInquiriesCardProps {
  inquiries: RecentInquiryItem[];
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return 'Baru saja';
  }
}

export function RecentInquiriesCard({ inquiries }: RecentInquiriesCardProps) {
  const unreadCount = inquiries.filter((i) => i.status === 'unread').length;

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary shrink-0" />
            Pesan Masuk
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-medium leading-none">
                {unreadCount} baru
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Inquiry & pertanyaan dari formulir kontak publik
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1 text-primary hover:text-primary">
          <Link href="/admin/inbox">
            Buka Inbox <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border p-4 bg-muted/20">
            <Mail className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium text-foreground">Kotak pesan bersih</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Belum ada pesan inquiry baru dari formulir kontak publik
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {inquiries.map((inquiry) => {
              const isUnread = inquiry.status === 'unread';
              return (
                <Link
                  key={inquiry.id}
                  href="/admin/inbox"
                  className={`py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group transition-colors -mx-2 px-2 rounded-md ${
                    isUnread
                      ? 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs truncate ${
                          isUnread
                            ? 'font-bold text-foreground group-hover:text-primary'
                            : 'font-medium text-foreground/90'
                        }`}
                      >
                        {inquiry.name}
                      </span>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                      {inquiry.subject}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 truncate">
                      {inquiry.email}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatRelativeTime(inquiry.createdAt)}
                    </span>
                    <Badge
                      variant={isUnread ? 'destructive' : 'secondary'}
                      className="text-[9px] px-1.5 py-0 font-normal leading-tight"
                    >
                      {isUnread ? 'Belum dibaca' : inquiry.status === 'replied' ? 'Dibalas' : 'Diarsipkan'}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
