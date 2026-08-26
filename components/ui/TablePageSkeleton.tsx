import { Skeleton } from "@/components/ui/Skeleton";

export function TablePageSkeleton({ statCards = 4, rows = 6 }: { statCards?: number; rows?: number }) {
  return (
    <div>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-72 mt-2" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {Array.from({ length: statCards }).map((_, i) => (
          <div key={i} className="rounded-2xl shadow-card p-5 bg-white">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14 mt-3" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden mt-6">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
