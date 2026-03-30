export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MonthTimeline } from "@/components/dashboard/maintenance/MonthTimeline";
import { MonthView } from "@/components/dashboard/maintenance/MonthView";
import { DeactivatePlanButton } from "@/components/dashboard/maintenance/details/DeactivatePlanButton";
import { ChevronLeft } from "lucide-react";

type Props = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function statusBadgeClass(color: string | null | undefined) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-green-200";
    case "amber":  return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "gray":
    default:       return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PlanDetailPage({ params, searchParams }: Props) {
  const { planId } = await params;
  const sp = await searchParams;
  const selectedMonthId = typeof sp.month === "string" ? sp.month : undefined;

  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("maintenance_plans")
    .select(`
      id, type, start_date, end_date, created_at,
      client:clients(id, name, company),
      status:catalog_status!status_id(id, label, color, value),
      project:projects(id, name),
      months:maintenance_months(
        id, month_number, year, month, status, report_generated_at, report_storage_path,
        tasks:maintenance_tasks(
          id, week_number, title, responsible, estimated_duration, order_index, notes, completed_at, internal_only,
          status:catalog_status!status_id(id, label, color, value)
        ),
        metrics:maintenance_metrics(
          id, total_clicks, total_impressions, avg_ctr, avg_position, total_sessions, notes, top_pages
        )
      )
    `)
    .eq("id", planId)
    .single();

  if (!raw) notFound();

  const [{ data: taskStatuses }] = await Promise.all([
    supabase
      .from("catalog_status")
      .select("id, label, color, value")
      .eq("category", "maintenance_task_status")
      .order("order_index"),
  ]);

  // Normalize
  const client = Array.isArray(raw.client) ? raw.client[0] ?? null : raw.client ?? null;
  const status = Array.isArray(raw.status) ? raw.status[0] ?? null : raw.status ?? null;

  const months = ((raw.months ?? []) as Record<string, unknown>[])
    .map((m) => {
      const rawTasks = (m.tasks as Record<string, unknown>[]) ?? [];
      const rawMetrics = m.metrics as Record<string, unknown>[] | Record<string, unknown> | null;
      return {
        id: m.id as string,
        month_number: m.month_number as number,
        year: m.year as number,
        month: m.month as number,
        status: m.status as string,
        report_generated_at: m.report_generated_at as string | null,
        report_storage_path: m.report_storage_path as string | null,
        tasks: rawTasks
          .map((t) => {
            const tStatus = Array.isArray(t.status)
              ? (t.status[0] ?? null)
              : (t.status ?? null);
            return {
              id: t.id as string,
              title: t.title as string,
              responsible: t.responsible as string,
              estimated_duration: t.estimated_duration as string | null,
              notes: t.notes as string | null,
              completed_at: t.completed_at as string | null,
              week_number: t.week_number as number,
              internal_only: (t.internal_only as boolean) ?? false,
              status: tStatus as { id: string; label: string; color: string; value: string } | null,
            };
          })
          .sort((a, b) => {
            if (a.week_number !== b.week_number) return a.week_number - b.week_number;
            return 0;
          }),
        metrics: (() => {
          const arr = Array.isArray(rawMetrics) ? rawMetrics : rawMetrics ? [rawMetrics] : [];
          return arr[0] ?? null;
        })() as {
          id: string;
          total_clicks: number | null;
          total_impressions: number | null;
          avg_ctr: number | null;
          avg_position: number | null;
          total_sessions: number | null;
          notes: string | null;
          top_pages: unknown;
        } | null,
      };
    })
    .sort((a, b) => a.month_number - b.month_number);

  // Determine the month to display
  const activeMonth = months.find((m) => m.status === "active");
  const selectedMonth = selectedMonthId
    ? (months.find((m) => m.id === selectedMonthId) ?? activeMonth ?? months[0])
    : (activeMonth ?? months[0]);

  const prevMonth = selectedMonth
    ? months.find((m) => m.month_number === selectedMonth.month_number - 1) ?? null
    : null;

  const canDeactivate =
    status?.value === "active" && raw.type === "recurring";

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <Link
        href="/dashboard/maintenance"
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4 inline-flex items-center gap-1"
      >
        <ChevronLeft size={'.8rem'}/>
        Mantenimiento
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-8 mb-8">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <h1 className="font-heading text-xl text-gray-900 truncate">
              {client?.company ?? "Sin Empresa"}
            </h1>
            {client?.name && (
              <p className="text-xs text-gray-400 mt-0.5">{client.name}</p>
            )}


            <div className="flex items-center gap-3 mt-8 flex-wrap">
                              {status && (
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-1 ${statusBadgeClass(status.color)}`}
                >
                  {status.label}
                </Badge>
              )}
              {raw.type === "spt" ? (
                <span className="text-xs font-semibold text-brand-700">
                  Sistema Presencia Total™
                </span>
              ) : (
                <span className="text-xs font-semibold text-gray-600">
                  Recurrente
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-end mt-auto gap-6">
            <div>
              <p className="text-xs text-gray-400">Inicio</p>
              <p className="text-xs font-medium text-gray-700">{formatDate(raw.start_date)}</p>
            </div>
              {raw.end_date && (
                <div>
                  <p className="text-xs text-gray-400">Fin</p>
                  <p className="text-xs font-medium text-gray-700">{formatDate(raw.end_date)}</p>
                </div>
              )}
            {canDeactivate && <DeactivatePlanButton planId={planId} />}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <MonthTimeline
          months={months}
          selectedMonthId={selectedMonth?.id ?? null}
          planId={planId}
        />
      </div>

      {selectedMonth ? (
        <MonthView
          month={selectedMonth}
          prevMonth={prevMonth}
          taskStatuses={taskStatuses ?? []}
          planId={planId}
          clientName={client?.name ?? "Sin cliente"}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No hay meses registrados en este plan.</p>
        </div>
      )}
    </div>
  );
}
