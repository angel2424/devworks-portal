"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { addTask } from "../[planId]/actions";

interface Props {
  monthId: string;
  weekNumber: number;
  planId: string;
}

export function AddTaskRow({ monthId, weekNumber, planId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [responsible, setResponsible] = useState("Angel");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  function handleCancel() {
    setOpen(false);
    setTitle("");
    setResponsible("Angel");
    setDuration("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await addTask(monthId, weekNumber, planId, {
          title,
          responsible,
          estimated_duration: duration,
        });
        setTitle("");
        setResponsible("Angel");
        setDuration("");
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al agregar tarea");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-brand-600 hover:bg-brand-50/50 rounded-lg transition-colors group"
      >
        <svg
          className="w-3.5 h-3.5 flex-shrink-0 transition-colors group-hover:text-brand-500"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Agregar tarea
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-brand-200 bg-brand-50/40 p-3 space-y-2.5"
    >
      {/* Title */}
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Descripción de la tarea…"
        required
        className="w-full text-sm text-gray-800 placeholder:text-gray-400 bg-white border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
      />

      {/* Responsible + Duration */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <input
            type="text"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="Responsable"
            className="w-full pl-7 pr-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
          />
        </div>
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duración (ej. 2 horas)"
            className="w-full pl-7 pr-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando…
            </>
          ) : (
            "Agregar"
          )}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
