'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Layers } from 'lucide-react';
import type { CategoryBookCount } from '@/lib/dashboard';

interface DashboardChartProps {
  data: CategoryBookCount[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  const hasData = data.length > 0 && data.some((item) => item.count > 0);

  return (
    <Card className="col-span-full border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Sebaran Judul Buku per Kategori
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Visualisasi jumlah inventaris judul buku yang dikelompokkan menurut kategori
          </CardDescription>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-mono border-primary/40 text-primary">
          {data.length} Kategori Terdaftar
        </Badge>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-[300px] rounded-lg border border-dashed border-border p-6 text-center bg-muted/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Belum Ada Data Buku</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Data grafik akan otomatis terisi setelah Anda menambahkan buku dan mengelompokkannya ke dalam kategori katalog.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  fontSize={12}
                  tickMargin={8}
                  className="fill-muted-foreground font-sans"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  fontSize={12}
                  tickMargin={8}
                  className="fill-muted-foreground font-sans"
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs">
                          <p className="font-semibold text-popover-foreground mb-1">{label}</p>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-muted-foreground">Jumlah Buku:</span>
                            <span className="font-bold text-foreground">
                              {payload[0].value} judul
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah Buku"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
