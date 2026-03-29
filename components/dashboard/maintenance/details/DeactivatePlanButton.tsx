"use client";

import { useState, useTransition } from "react";
import { deactivatePlan } from "../../../../app/(dashboard)/dashboard/maintenance/[planId]/actions";

export function DeactivatePlanButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDeactivate() {
    startTransition(() => deactivatePlan(planId));
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <p className="text-xs text-red-700 font-medium">
          ¿Desactivar al final del mes?
        </p>
        <button
          onClick={handleDeactivate}
          disabled={isPending}
          className="text-xs font-semibold text-red-700 hover:text-red-800 disabled:opacity-50 px-2 py-0.5 rounded border border-red-300 hover:bg-red-100 transition-colors"
        >
          {isPending ? "…" : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      Desactivar
    </button>
  );
}
