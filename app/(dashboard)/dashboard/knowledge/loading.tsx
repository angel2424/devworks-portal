import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeLoading() {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white p-4 gap-2">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 px-2">
            <Skeleton className="w-4 h-4 rounded shrink-0" />
            <Skeleton className="h-3.5 flex-1" style={{ width: `${60 + i * 5}%` }} />
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 pl-6">
              <Skeleton className="w-3.5 h-3.5 rounded shrink-0" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="flex-1 flex flex-col p-5 sm:p-6 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        {/* Mobile folder select */}
        <Skeleton className="h-9 w-full rounded-lg mb-4 md:hidden" />

        {/* Article list */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white">
              <Skeleton className="w-5 h-5 rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-3 w-16 shrink-0 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
