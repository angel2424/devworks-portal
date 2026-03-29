"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { deleteProject } from "./actions";

interface Props {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirmed = typed === projectName;

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTyped("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleConfirm() {
    if (!confirmed || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteProject(projectId);
        router.push("/dashboard/projects");
      } catch {
        setError("No se pudo eliminar el proyecto. Intenta de nuevo.");
      }
    });
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        Eliminar
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

            {/* Red top bar */}
            <div className="h-1 bg-red-500 w-full" />

            <div className="px-6 pt-6 pb-7 space-y-5">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4.5 h-4.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-heading text-base text-gray-900">
                    Eliminar proyecto
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Esta acción es permanente e irreversible. Se eliminarán todas las tareas y fases asociadas.
                  </p>
                </div>
              </div>

              {/* Project name display */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Proyecto a eliminar
                </p>
                <p className="text-sm font-semibold text-gray-800 break-all">{projectName}</p>
              </div>

              {/* Confirmation input */}
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  Para confirmar, escribe{" "}
                  <span className="font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                    {projectName}
                  </span>{" "}
                  a continuación:
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                  disabled={isPending}
                  placeholder="Escribe el nombre del proyecto…"
                  spellCheck={false}
                  autoComplete="off"
                  className={cn(
                    "w-full h-9 rounded-lg border px-3 text-sm transition-all outline-none",
                    "placeholder:text-gray-300 disabled:opacity-50",
                    confirmed
                      ? "border-red-300 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-white text-gray-900 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                  )}
                />
                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 h-9 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!confirmed || isPending}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-sm font-semibold transition-all",
                    confirmed && !isPending
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Eliminando…
                    </span>
                  ) : (
                    "Sí, eliminar proyecto"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
