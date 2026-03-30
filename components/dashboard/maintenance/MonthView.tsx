"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TaskRow, type Task, type TaskStatus } from "./TaskRow";
import { AddTaskRow } from "./AddTaskRow";
import { MetricsForm } from "./MetricsForm";
import { MetricsComparison } from "./MetricsComparison";
import { ReportDownloadButton } from "./ReportDownloadButton";
import { BarChart } from "lucide-react";

type Metrics = {
  id: string;
  total_clicks: number | null;
  total_impressions: number | null;
  avg_ctr: number | null;
  avg_position: number | null;
  total_sessions: number | null;
  notes: string | null;
  top_pages: unknown;
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
  const [metricsOpen, setMetricsOpen] = useState(false);

  function toggleWeek(week: number) {
    setCollapsedWeeks((prev) => {
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
      <div className="space-y-3 mt-12">
        {Array.from({ length: 4 }, (_, i) => i + 1).map((week) => {
          const tasks = tasksByWeek.get(week) ?? [];
          const isCollapsed = collapsedWeeks.has(week);
          const weekDone = tasks.filter((t) => t.status?.value === "done").length;
          const isWeek4 = week === 4;

          if (tasks.length === 0) return null;

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
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      statuses={taskStatuses}
                      planId={planId}
                    />
                  ))}
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
