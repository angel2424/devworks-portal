"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { TaskRow, type Task, type TaskStatus } from "./TaskRow";
import { AddTaskRow } from "./AddTaskRow";
import { MetricsForm } from "./MetricsForm";
import { MetricsComparison } from "./MetricsComparison";
import { ReportDownloadButton } from "./ReportDownloadButton";
import { BarChart, ChevronRight } from "lucide-react";
import { saveMetrics } from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions";
import type { PageSpeedResult } from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions";

type Metrics = {
  id: string;
  total_clicks: number | null;
  total_impressions: number | null;
  avg_ctr: number | null;
  avg_position: number | null;
  total_sessions: number | null;
  notes: string | null;
  top_pages: unknown;
  pagespeed_url: string | null;
  pagespeed_mobile: PageSpeedResult | null;
  pagespeed_desktop: PageSpeedResult | null;
  gsc_site_url: string | null;
  gsc_top_queries: import("@/app/(dashboard)/dashboard/maintenance/[planId]/actions").GSCRow[] | null;
  gsc_top_pages: import("@/app/(dashboard)/dashboard/maintenance/[planId]/actions").GSCRow[] | null;
  gsc_top_countries: import("@/app/(dashboard)/dashboard/maintenance/[planId]/actions").GSCRow[] | null;
  gsc_fetched_at: string | null;
} | null;

type Month = {
  id: string;
  month_number: number;
  year: number;
  month: number;
  status: string;
  report_generated_at: string | null;
  report_storage_path: string | null;
  tasks: Task[];
  metrics: Metrics;
};

interface Props {
  month: Month;
  prevMonth: Month | null | undefined;
  taskStatuses: TaskStatus[];
  planId: string;
  clientName: string;
}

const WEEK_LABELS = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function MonthView({ month, prevMonth, taskStatuses, planId, clientName }: Props) {
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
  const [expandedCompleted, setExpandedCompleted] = useState<Set<number>>(new Set());
  const [metricsOpen, setMetricsOpen] = useState(false);

  function toggleWeek(week: number) {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  function toggleCompleted(week: number) {
    setExpandedCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  // Group tasks by week
  const tasksByWeek = new Map<number, Task[]>();
  for (let w = 1; w <= 4; w++) tasksByWeek.set(w, []);
  for (const task of month.tasks) {
    const arr = tasksByWeek.get(task.week_number);
    if (arr) arr.push(task);
  }

  // Progress
  const total = month.tasks.length;
  const done = month.tasks.filter((t) => t.status?.value === "done").length;
  const skipped = month.tasks.filter((t) => t.status?.value === "skipped").length;
  const progressPct = total > 0 ? Math.round(((done + skipped) / total) * 100) : 0;

  // Weeks with at least one non-skipped task
  const hasVisibleTasks = Array.from({ length: 4 }, (_, i) => i + 1).some((w) => {
    const wt = tasksByWeek.get(w) ?? [];
    return wt.length > 0 && !wt.every((t) => t.status?.value === "skipped");
  });

  const monthLabel = `${MONTH_NAMES[month.month - 1]} ${month.year}`;

  return (
    <div className="space-y-6">
      {/* Month header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-xl text-gray-900">{monthLabel}</h2>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Mes {month.month_number}
            </span>
            <StatusPill status={month.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {done} de {total} tareas completadas
            {skipped > 0 && ` · ${skipped} omitida${skipped > 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          onClick={() => setMetricsOpen(!metricsOpen)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
            metricsOpen
              ? "border-brand-400 bg-brand-50 text-brand-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <BarChart size={'1rem'}/>
          Métricas
        </button>
      </div>

      <div className="space-y-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{progressPct}% completado</span>
          <span>{total - done - skipped} pendientes</span>
        </div>
      </div>

      {metricsOpen && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5 space-y-5">
          <MetricsForm
            monthId={month.id}
            planId={planId}
            month={month.month}
            year={month.year}
            current={month.metrics}
            prev={prevMonth?.metrics ?? null}
            onSaved={() => setMetricsOpen(false)}
          />
          {month.metrics && prevMonth?.metrics && (
            <div className="pt-4 border-t border-brand-200/50">
              <MetricsComparison current={month.metrics} previous={prevMonth.metrics} />
            </div>
          )}
        </div>
      )}

      {/* Weekly task groups */}
      {hasVisibleTasks && (
      <div className="space-y-3 mt-12">
        {Array.from({ length: 4 }, (_, i) => i + 1).map((week) => {
          const tasks = tasksByWeek.get(week) ?? [];
          const isCollapsed = collapsedWeeks.has(week);
          const weekDone = tasks.filter((t) => t.status?.value === "done").length;
          const isWeek4 = week === 4;

          if (tasks.length === 0) return null;
          if (tasks.every((t) => t.status?.value === "skipped")) return null;

          const STATUS_ORDER: Record<string, number> = { in_progress: 0, pending: 1, skipped: 2 };
          const activeTasks = tasks
            .filter((t) => t.status?.value !== "done")
            .sort((a, b) => {
              const diff = (STATUS_ORDER[a.status?.value ?? ""] ?? 1) - (STATUS_ORDER[b.status?.value ?? ""] ?? 1);
              return diff;
            });
          const completedTasks = tasks.filter((t) => t.status?.value === "done");
          const isCompletedExpanded = expandedCompleted.has(week);

          return (
            <div
              key={week}
              className={cn(
                "rounded-xl border overflow-hidden",
                isWeek4 ? "border-amber-200" : "border-gray-200"
              )}
            >
              {/* Week header */}
              <button
                onClick={() => toggleWeek(week)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  isWeek4 ? "bg-amber-50/60 hover:bg-amber-50" : "bg-gray-50/60 hover:bg-gray-100/60"
                )}
              >
                <svg
                  className={cn(
                    "w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150",
                    isCollapsed && "-rotate-90"
                  )}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>

                <span className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isWeek4 ? "text-amber-700" : "text-gray-500"
                )}>
                  {WEEK_LABELS[week - 1]}
                  {isWeek4 && (
                    <span className="ml-2 normal-case font-normal text-amber-600/70">
                      · Reporte mensual
                    </span>
                  )}
                </span>

                <span className="ml-auto text-xs text-gray-400 font-medium bg-white/80 px-1.5 py-0.5 rounded-full">
                  {weekDone}/{tasks.length}
                </span>
              </button>

              {/* Task list */}
              {!isCollapsed && (
                <div className="p-3 space-y-2">
                  {activeTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      statuses={taskStatuses}
                      planId={planId}
                    />
                  ))}

                  {/* Completed tasks toggle */}
                  {completedTasks.length > 0 && (
                    <>
                      <button
                        onClick={() => toggleCompleted(week)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-1 py-0.5 w-full"
                      >
                        <ChevronRight
                          className={cn(
                            "w-3 h-3 shrink-0 transition-transform duration-150",
                            isCompletedExpanded && "rotate-90"
                          )}
                        />
                        {completedTasks.length} completada{completedTasks.length !== 1 ? "s" : ""}
                      </button>
                      {isCompletedExpanded && completedTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          statuses={taskStatuses}
                          planId={planId}
                        />
                      ))}
                    </>
                  )}

                  <AddTaskRow
                    monthId={month.id}
                    weekNumber={week}
                    planId={planId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Observations */}
      <ObservationsSection
        monthId={month.id}
        planId={planId}
        initialNotes={month.metrics?.notes ?? null}
      />

      {/* Report section */}
      <ReportDownloadButton
        month={month.month}
        year={month.year}
        monthNumber={month.month_number}
        reportGeneratedAt={month.report_generated_at}
        reportStoragePath={month.report_storage_path}
        clientName={clientName}
        tasks={month.tasks}
        metrics={month.metrics}
        prevMetrics={prevMonth?.metrics ?? null}
      />
    </div>
  );
}

function ObservationsSection({
  monthId,
  planId,
  initialNotes,
}: {
  monthId: string;
  planId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [mode, setMode] = useState<"edit" | "preview">(initialNotes ? "preview" : "edit");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await saveMetrics(monthId, planId, { notes: notes.trim() || null });
      setSaved(true);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Observaciones y plan de acción</p>
          <p className="text-xs text-gray-400 mt-0.5">Soporta formato Markdown</p>
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-all",
              mode === "edit" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Editar
          </button>
          <button
            onClick={() => setMode("preview")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-all",
              mode === "preview" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Vista previa
          </button>
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
          rows={10}
          placeholder={`## Observaciones del mes\n\nDescribe tendencias, hallazgos clave...\n\n## Plan de acción\n\n- [ ] Tarea 1\n- [ ] Tarea 2`}
          className="w-full font-mono text-sm text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-y transition-all"
        />
      ) : (
        <div className="min-h-40 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          {notes.trim() ? (
            <div className="md-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin contenido aún.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={cn(
          "text-xs transition-opacity duration-300",
          saved ? "text-green-700 opacity-100" : "opacity-0"
        )}>
          Guardado correctamente.
        </span>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-50 transition-all"
        >
          {isPending ? "Guardando…" : "Guardar observaciones"}
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active:    { label: "Activo",     className: "bg-green-50 text-green-700 border-green-200" },
    completed: { label: "Completado", className: "bg-blue-50 text-blue-700 border-blue-200" },
    archived:  { label: "Archivado",  className: "bg-gray-100 text-gray-500 border-gray-200" },
  };
  const s = map[status] ?? map.archived;
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", s.className)}>
      {s.label}
    </span>
  );
}
