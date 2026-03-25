"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { cycleTaskStatus, setTaskSkipped, saveTaskNotes } from "../[planId]/actions";

export type TaskStatus = {
  id: string;
  label: string;
  color: string | null;
  value: string;
};

export type Task = {
  id: string;
  title: string;
  responsible: string;
  estimated_duration: string | null;
  notes: string | null;
  completed_at: string | null;
  week_number: number;
  status: TaskStatus | null;
};

interface Props {
  task: Task;
  statuses: TaskStatus[];
  planId: string;
}

function statusBadgeClass(color: string | null | undefined) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-green-200";
    case "amber":  return "bg-amber-50 text-amber-700 border-amber-200";
    case "red":    return "bg-red-50 text-red-700 border-red-200";
    case "gray":
    default:       return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

export function TaskRow({ task, statuses, planId }: Props) {
  const [isPendingCycle, startCycle] = useTransition();
  const [isPendingSkip, startSkip] = useTransition();
  const [isPendingNotes, startNotes] = useTransition();
  const [notesOpen, setNotesOpen] = useState(!!task.notes);
  const [notesValue, setNotesValue] = useState(task.notes ?? "");

  const isPending = isPendingCycle || isPendingSkip || isPendingNotes;

  function handleCycle() {
    if (isPending) return;
    const simplifiedStatuses = statuses.map((s) => ({ id: s.id, value: s.value }));
    startCycle(() =>
      cycleTaskStatus(
        task.id,
        task.status?.value ?? "pending",
        simplifiedStatuses,
        planId
      )
    );
  }

  function handleSkip() {
    if (isPending) return;
    const simplifiedStatuses = statuses.map((s) => ({ id: s.id, value: s.value }));
    startSkip(() => setTaskSkipped(task.id, simplifiedStatuses, planId));
  }

  function handleSaveNotes() {
    startNotes(() => saveTaskNotes(task.id, notesValue, planId));
  }

  const statusColor = task.status?.color;
  const isDone = task.status?.value === "done";
  const isSkipped = task.status?.value === "skipped";

  return (
    <div
      className={cn(
        "group rounded-lg border transition-all",
        isDone && "border-green-200 bg-green-50/40",
        isSkipped && "border-gray-200 bg-gray-50/60 opacity-60",
        !isDone && !isSkipped && "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Status cycle button */}
        <button
          onClick={handleCycle}
          disabled={isPending}
          title="Cambiar estado (click para avanzar)"
          className={cn(
            "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
            isPendingCycle && "opacity-50 cursor-wait",
            isDone
              ? "border-green-500 bg-green-500 text-white"
              : isSkipped
              ? "border-gray-300 bg-gray-100"
              : "border-gray-300 hover:border-brand-400 hover:bg-brand-50"
          )}
        >
          {isDone && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isSkipped && (
            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {!isDone && !isSkipped && isPendingCycle && (
            <svg className="w-3 h-3 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span
              className={cn(
                "text-sm font-medium leading-snug",
                isDone ? "line-through text-gray-400" : "text-gray-800"
              )}
            >
              {task.title}
            </span>

            {/* Status badge */}
            {task.status && (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                  statusBadgeClass(statusColor)
                )}
              >
                {task.status.label}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              {task.responsible}
            </span>
            {task.estimated_duration && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {task.estimated_duration}
              </span>
            )}
            {isDone && task.completed_at && (
              <span className="text-xs text-green-600">
                Completada {new Date(task.completed_at).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>

          {/* Notes */}
          {notesOpen && (
            <div className="mt-2 space-y-1.5">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={2}
                placeholder="Notas de completado…"
                className="w-full text-xs text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none transition-all"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={isPendingNotes}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors"
                >
                  {isPendingNotes ? "Guardando…" : "Guardar"}
                </button>
                <button
                  onClick={() => setNotesOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Notes toggle */}
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            title="Notas"
            className={cn(
              "p-1.5 rounded-md transition-colors",
              notesOpen
                ? "text-brand-600 bg-brand-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </button>

          {/* Skip */}
          {!isDone && !isSkipped && (
            <button
              onClick={handleSkip}
              disabled={isPending}
              title="Omitir tarea"
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
