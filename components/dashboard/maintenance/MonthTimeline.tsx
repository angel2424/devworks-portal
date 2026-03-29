"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bookmark, CheckCircle, Dot, Save } from "lucide-react";

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
                "flex flex-col items-center px-4 lg:pl-6 py-2.5 border-2 rounded-xl text-center transition-all flex-1",
                isSelected && "border-brand-500",
                !isSelected && isCompleted && "border-green-200 bg-green-50 hover:border-green-300",
                !isSelected && isArchived && "border-gray-200 bg-gray-50 opacity-60 hover:opacity-80",
                !isSelected && !isCompleted && !isArchived && "border-gray-200 bg-white hover:border-brand-200 hover:bg-brand-50/40"
              )}
            >
                <div className="flex flex-col lg:flex-row items-center justify-between w-full">
                    <span
                        className={cn(
                        "text-xs",
                        isSelected ? "text-brand-500" : "text-gray-400"
                        )}
                    >
                        {MONTH_NAMES[m.month - 1]} | {m.year}
                    </span>
                        {isCompleted ? (
                        <CheckCircle size={'1.8rem'}/>
                        ) : isArchived ? (
                        <Bookmark size='2rem'/>
                        ) : isSelected ? (
                        <Dot className="text-primary" size={'2rem'} />
                        ) : (
                        <Dot className="text-gray-300" size={'2rem'} />
                        )}
                </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
