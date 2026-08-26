import { Skeleton } from "@/components/ui/Skeleton";

export function CrmSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-4 w-72 mt-2" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl shadow-card p-5 bg-white">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-10 mt-3" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-3 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className="space-y-3">
              <Skeleton className="h-5 w-full" />
              {Array.from({ length: 2 }).map((_, card) => (
                <Skeleton key={card} className="h-24 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
