import { Skeleton } from "@/components/ui/skeleton";

export default function MaintenancePlanLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-3 rounded-sm" />
        <Skeleton className="h-3.5 w-32" />
      </div>

      {/* Plan header card */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Month timeline skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-24 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Week sections */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, weekIdx) => (
          <div key={weekIdx} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
