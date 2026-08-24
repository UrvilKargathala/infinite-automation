import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-72 mt-2" />

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl shadow-card p-5 bg-white">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20 mt-3" />
            <Skeleton className="h-3 w-28 mt-3" />
          </div>
        ))}
      </div>

      {/* Row 2 — Line chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-4 sm:p-6">
          <Skeleton className="h-5 w-40 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-card p-4 sm:p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="flex justify-center">
            <Skeleton className="h-[190px] w-[190px] rounded-full" />
          </div>
          <div className="space-y-3 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — Bar chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-4 sm:p-6">
          <Skeleton className="h-5 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-card p-4 sm:p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-16 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
