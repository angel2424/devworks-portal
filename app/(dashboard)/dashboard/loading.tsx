import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-7 md:mb-10">
        <Skeleton className="h-7 w-44 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[90px] rounded-xl" />
        ))}
      </div>

      {/* Body: tasks + quick actions */}
      <div className="flex flex-col-reverse lg:flex-row items-start gap-5 md:gap-6">
        {/* Today's tasks skeleton */}
        <div className="w-full lg:w-80 shrink-0">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + deadlines skeleton */}
        <div className="flex-1 w-full space-y-6 md:space-y-8">
          <div>
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
