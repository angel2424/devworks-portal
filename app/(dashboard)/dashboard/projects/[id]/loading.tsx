import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-7">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3 w-3 rounded-sm" />
        <Skeleton className="h-3.5 w-32" />
      </div>

      {/* Project header card */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div>
              <Skeleton className="h-6 w-52 mb-2" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>

      {/* Tasks section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </div>

        {/* View switcher skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        {/* Task phase blocks */}
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
              <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center gap-3">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-1.5 flex-1 max-w-32 rounded-full" />
              </div>
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4 px-4 py-3">
                    <Skeleton className="w-4 h-4 rounded shrink-0" />
                    <Skeleton className="h-3.5 flex-1" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-3.5 w-20 hidden sm:block" />
                    <Skeleton className="h-3.5 w-20 hidden sm:block" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
