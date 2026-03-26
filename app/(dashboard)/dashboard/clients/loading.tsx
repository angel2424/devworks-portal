import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export default function ClientsLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Skeleton className="h-7 w-44 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Toolbar */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-3 w-20 mb-4" />

      {/* Mobile grid (shown below md) */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Desktop table (shown at md+) */}
      <div className="hidden md:block rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="bg-gray-50/60 h-10 flex items-center px-5 gap-6 border-b border-gray-100">
          {["40%", "20%", "15%", "15%", "10%"].map((w, i) => (
            <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center px-5 py-3.5 gap-6 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3" style={{ width: "40%" }}>
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
            <Skeleton className="h-3.5 rounded" style={{ width: "20%" }} />
            <Skeleton className="h-5 w-16 rounded-full" style={{ width: "15%" }} />
            <Skeleton className="h-3.5 rounded" style={{ width: "15%" }} />
            <Skeleton className="h-3 rounded" style={{ width: "10%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
