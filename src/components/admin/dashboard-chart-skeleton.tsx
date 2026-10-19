import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardChartSkeleton() {
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-end gap-6 pt-6 px-4">
          <Skeleton className="h-[60%] flex-1 rounded-t-md" />
          <Skeleton className="h-[85%] flex-1 rounded-t-md" />
          <Skeleton className="h-[40%] flex-1 rounded-t-md" />
          <Skeleton className="h-[70%] flex-1 rounded-t-md" />
          <Skeleton className="h-[50%] flex-1 rounded-t-md" />
        </div>
      </CardContent>
    </Card>
  );
}
