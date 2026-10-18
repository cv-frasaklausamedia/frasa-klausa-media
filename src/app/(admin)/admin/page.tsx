import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Layers, BookCheck, FileText } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
            Ringkasan Dashboard
          </h1>
          <p className="text-muted-foreground">
            Selamat datang di Content Management System Frasa Klausa Media.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
          <Sparkles className="h-3 w-3" /> Tahap 0 Siap
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Katalog Buku</CardTitle>
            <BookCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 Buku</div>
            <p className="text-xs text-muted-foreground mt-1">Dikelola di Tahap 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Artikel Blog</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 Artikel</div>
            <p className="text-xs text-muted-foreground mt-1">Dikelola di Tahap 6</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 Kategori</div>
            <p className="text-xs text-muted-foreground mt-1">Dikelola di Tahap 4</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
