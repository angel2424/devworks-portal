"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type TimelineMonth = {
  id: string;
  month_number: number;
  year: number;
  month: number;
  status: string;
};

interface Props {
  months: TimelineMonth[];
  selectedMonthId: string | null;
  planId: string;
}

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function MonthTimeline({ months, selectedMonthId, planId }: Props) {
  if (months.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Meses del plan
      </p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {months.map((m) => {
          const isSelected = m.id === selectedMonthId;
          const isCompleted = m.status === "completed";
          const isArchived = m.status === "archived";

          return (
            <Link
              key={m.id}
              href={`/dashboard/maintenance/${planId}?month=${m.id}`}
              className={cn(
                "flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border text-center transition-all min-w-[72px]",
                isSelected && "border-brand-400 bg-brand-50 ring-1 ring-brand-300",
                !isSelected && isCompleted && "border-green-200 bg-green-50 hover:border-green-300",
                !isSelected && isArchived && "border-gray-200 bg-gray-50 opacity-60 hover:opacity-80",
                !isSelected && !isCompleted && !isArchived && "border-gray-200 bg-white hover:border-brand-200 hover:bg-brand-50/40"
              )}
            >
              {/* Month number */}
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider mb-0.5",
                  isSelected ? "text-brand-600" : isCompleted ? "text-green-600" : "text-gray-400"
                )}
              >
                Mes {m.month_number}
              </span>

              {/* Month name */}
              <span
                className={cn(
                  "text-sm font-semibold leading-none",
                  isSelected ? "text-brand-700" : isCompleted ? "text-green-700" : "text-gray-700"
                )}
              >
                {MONTH_NAMES[m.month - 1]}
              </span>

              {/* Year */}
              <span
                className={cn(
                  "text-[10px] mt-0.5",
                  isSelected ? "text-brand-500" : "text-gray-400"
                )}
              >
                {m.year}
              </span>

              {/* Status indicator */}
              <div className="mt-1.5">
                {isCompleted ? (
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isArchived ? (
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ) : isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
