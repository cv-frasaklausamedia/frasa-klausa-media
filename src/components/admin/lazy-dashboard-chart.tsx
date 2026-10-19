'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { DashboardChartSkeleton } from '@/components/admin/dashboard-chart-skeleton';
import type { CategoryBookCount } from '@/lib/dashboard';

const DynamicChart = dynamic(
  () => import('@/components/admin/dashboard-chart').then((mod) => mod.DashboardChart),
  {
    ssr: false,
    loading: () => <DashboardChartSkeleton />,
  }
);

interface LazyDashboardChartProps {
  data: CategoryBookCount[];
}

export function LazyDashboardChart({ data }: LazyDashboardChartProps) {
  return <DynamicChart data={data} />;
}
