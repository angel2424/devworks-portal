"use client";

import { useTransition } from "react";
import { createCurrentMonthIfMissing } from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { planId: string; monthLabel: string };

export function SyncMonthButton({ planId, monthLabel }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await createCurrentMonthIfMissing(planId);
    });
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm text-amber-800">
        El mes de <span className="font-semibold">{monthLabel}</span> aún no ha sido creado para este plan.
      </p>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
        )}
      >
        <RefreshCw size={12} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Creando…" : "Crear mes"}
      </button>
    </div>
  );
}
