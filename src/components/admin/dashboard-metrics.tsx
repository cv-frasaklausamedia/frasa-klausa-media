import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Tags, FileText, Sparkles } from 'lucide-react';
import type { DashboardMetrics } from '@/lib/dashboard';
import { Badge } from '@/components/ui/badge';

interface DashboardMetricsCardsProps {
  metrics: DashboardMetrics;
}

export function DashboardMetricsCards({ metrics }: DashboardMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Buku',
      value: metrics.totalBooks.toLocaleString('id-ID'),
      description: 'Judul buku terdaftar dalam katalog',
      icon: BookOpen,
      badge: 'Katalog',
    },
    {
      title: 'Kategori Buku',
      value: metrics.totalCategories.toLocaleString('id-ID'),
      description: 'Klasifikasi ragam karya buku',
      icon: Tags,
      badge: 'Taksonomi',
    },
    {
      title: 'Artikel Blog',
      value: metrics.totalPosts.toLocaleString('id-ID'),
      description: 'Publikasi artikel & wawasan literasi',
      icon: FileText,
      badge: 'Artikel',
    },
    {
      title: 'Banner Aktif',
      value: metrics.activeBanners.toLocaleString('id-ID'),
      description: `${metrics.unreadInquiries} pesan kontak belum dibaca`,
      icon: Sparkles,
      badge: metrics.unreadInquiries > 0 ? `${metrics.unreadInquiries} pesan baru` : 'Siap tayang',
      badgeVariant: metrics.unreadInquiries > 0 ? ('destructive' as const) : ('secondary' as const),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="relative overflow-hidden transition-all hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{card.description}</p>
                <Badge variant={card.badgeVariant ?? 'outline'} className="text-[10px] shrink-0 font-normal">
                  {card.badge}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
