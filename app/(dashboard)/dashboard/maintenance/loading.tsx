import { Skeleton } from "@/components/ui/skeleton";

function PlanCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="pt-2.5 border-t border-gray-100">
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export default function MaintenanceLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-1.5">
        <Skeleton className="h-9 w-full sm:max-w-xs rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-40 rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-44 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-20 mb-5" />

      {/* Mobile grid */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <PlanCardSkeleton key={i} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="bg-gray-50/60 h-10 flex items-center px-5 gap-6 border-b border-gray-100">
          {["30%", "12%", "15%", "20%", "12%", "11%"].map((w, i) => (
            <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center px-5 py-3.5 gap-6 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2" style={{ width: "30%" }}>
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3.5 rounded" style={{ width: "20%" }} />
            <Skeleton className="h-3 rounded" style={{ width: "12%" }} />
            <Skeleton className="h-3 rounded" style={{ width: "11%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
