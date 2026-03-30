"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { cycleTaskStatus, setTaskSkipped, saveTaskNotes, toggleTaskInternalOnly, setTaskStatus } from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions";
import { Eye, EyeOff, NotebookPen, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  internal_only: boolean;
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
  const [isPendingInternal, startInternal] = useTransition();
  const [isPendingStatus, startStatus] = useTransition();
  const [notesOpen, setNotesOpen] = useState(!!task.notes);
  const [notesValue, setNotesValue] = useState(task.notes ?? "");

  const isPending = isPendingCycle || isPendingSkip || isPendingNotes || isPendingInternal || isPendingStatus;

  function handleSetStatus(statusId: string, statusValue: string) {
    if (isPending) return;
    startStatus(() => setTaskStatus(task.id, statusId, statusValue, planId));
  }

  function handleToggleInternal() {
    if (isPending) return;
    startInternal(() => toggleTaskInternalOnly(task.id, task.internal_only, planId));
  }

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
        !isDone && !isSkipped && task.internal_only && "border-violet-100 bg-violet-50/30",
        !isDone && !isSkipped && !task.internal_only && "border-gray-200 bg-white hover:border-gray-300"
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
            isPendingCycle && "cursor-wait",
            isDone    && "border-green-500 bg-green-500 text-white hover:bg-green-600 hover:border-green-600",
            isSkipped && "border-red-400 bg-red-50 hover:bg-red-100",
            !isDone && !isSkipped && task.status?.value === "in_progress" && "border-amber-400 bg-amber-50 hover:bg-amber-100",
            !isDone && !isSkipped && task.status?.value === "pending"     && "border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50"
          )}
        >
          {isPendingCycle ? (
            <svg className="w-2.5 h-2.5 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isDone ? (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isSkipped ? (
            <svg className="w-2.5 h-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
            </svg>
          ) : task.status?.value === "in_progress" ? (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          ) : null}
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

            {/* Status badge dropdown */}
            {task.status && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isPendingStatus}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-opacity hover:opacity-80 disabled:cursor-wait",
                      statusBadgeClass(statusColor)
                    )}
                  >
                    {task.status.label}
                    <ChevronDown size={10} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px] bg-white">
                  {statuses.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onSelect={() => handleSetStatus(s.id, s.value)}
                      className={cn(
                        "text-xs cursor-pointer",
                        task.status?.id === s.id && "font-semibold"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border mr-2",
                          statusBadgeClass(s.color)
                        )}
                      >
                        {s.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <User size={'.8rem'} />
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

        <div className="flex items-center gap-1 opacity-100 transition-opacity">
          <button
            onClick={handleToggleInternal}
            disabled={isPendingInternal}
            title={task.internal_only ? "Marcar como visible para cliente" : "Ocultar del reporte (solo equipo)"}
            className={cn(
              "p-1.5 rounded-md transition-colors disabled:opacity-50",
              task.internal_only
                ? "text-brand-600 bg-brand-50"
                : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"
            )}
          >
            {task.internal_only ? (
              <EyeOff size={'.8rem'} />
            ) : (
              <Eye size={'.8rem'} />
            )}
          </button>

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
            <NotebookPen size={'.8rem'} />
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
