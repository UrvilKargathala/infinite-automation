import { Skeleton } from "@/components/ui/Skeleton";

export function AuditPageSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-72 mt-2" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl shadow-card p-5 bg-white">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14 mt-3" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
