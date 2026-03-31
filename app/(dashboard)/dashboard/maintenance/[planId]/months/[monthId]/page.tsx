export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MonthView } from "@/components/dashboard/maintenance/MonthView";

type Props = {
  params: Promise<{ planId: string; monthId: string }>;
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function MonthDetailPage({ params }: Props) {
  const { planId, monthId } = await params;
  const supabase = await createClient();

  const [{ data: rawMonth }, { data: taskStatuses }] = await Promise.all([
    supabase
      .from("maintenance_months")
      .select(`
        id, month_number, year, month, status, report_generated_at, report_storage_path,
        plan:maintenance_plans(
          id, type,
          client:clients(id, name)
        ),
        tasks:maintenance_tasks(
          id, week_number, title, responsible, estimated_duration, order_index, notes, completed_at, internal_only,
          status:catalog_status!status_id(id, label, color, value)
        ),
        metrics:maintenance_metrics(
          id, total_clicks, total_impressions, avg_ctr, avg_position, total_sessions, notes, top_pages
        )
      `)
      .eq("id", monthId)
      .eq("plan_id", planId)
      .single(),
    supabase
      .from("catalog_status")
      .select("id, label, color, value")
      .eq("category", "maintenance_task_status")
      .order("order_index"),
  ]);

  if (!rawMonth) notFound();

  // Get previous month metrics
  const { data: prevRaw } = await supabase
    .from("maintenance_months")
    .select(`
      id, month_number, year, month, status, report_generated_at, report_storage_path,
      tasks:maintenance_tasks(
        id, week_number, title, responsible, estimated_duration, order_index, notes, completed_at,
        status:catalog_status!status_id(id, label, color, value)
      ),
      metrics:maintenance_metrics(
        id, total_clicks, total_impressions, avg_ctr, avg_position, total_sessions, notes, top_pages
      )
    `)
    .eq("plan_id", planId)
    .eq("month_number", (rawMonth.month_number as number) - 1)
    .single();

  function normalizeMonth(m: Record<string, unknown>) {
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
        .map((t) => ({
          id: t.id as string,
          title: t.title as string,
          responsible: t.responsible as string,
          estimated_duration: t.estimated_duration as string | null,
          notes: t.notes as string | null,
          completed_at: t.completed_at as string | null,
          week_number: t.week_number as number,
          internal_only: (t.internal_only as boolean) ?? false,
          status: (Array.isArray(t.status) ? t.status[0] ?? null : t.status ?? null) as {
            id: string; label: string; color: string; value: string
          } | null,
        }))
        .sort((a, b) => {
          if (a.week_number !== b.week_number) return a.week_number - b.week_number;
          return 0;
        }),
      metrics: (() => {
        const arr = Array.isArray(rawMetrics) ? rawMetrics : rawMetrics ? [rawMetrics] : [];
        const base = arr[0] ?? null;
        if (!base) return null;
        return {
          ...(base as {
            id: string;
            total_clicks: number | null;
            total_impressions: number | null;
            avg_ctr: number | null;
            avg_position: number | null;
            total_sessions: number | null;
            notes: string | null;
            top_pages: unknown;
          }),
          pagespeed_url: null,
          pagespeed_mobile: null,
          pagespeed_desktop: null,
          gsc_site_url: null,
          gsc_top_queries: null,
          gsc_top_pages: null,
          gsc_top_countries: null,
          gsc_fetched_at: null,
        };
      })(),
    };
  }

  const month = normalizeMonth(rawMonth as Record<string, unknown>);
  const prevMonth = prevRaw ? normalizeMonth(prevRaw as Record<string, unknown>) : null;

  const rawPlan = rawMonth.plan as Record<string, unknown>[] | Record<string, unknown> | null;
  const plan = Array.isArray(rawPlan) ? rawPlan[0] ?? null : rawPlan ?? null;
  const rawClient = plan ? (plan.client as Record<string, unknown>[] | Record<string, unknown> | null) : null;
  const client = Array.isArray(rawClient) ? rawClient[0] ?? null : rawClient ?? null;

  const monthLabel = `${MONTH_NAMES[month.month - 1]} ${month.year}`;

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <Link href="/dashboard/maintenance" className="hover:text-gray-600 transition-colors">
          Mantenimiento
        </Link>
        <span>/</span>
        <Link href={`/dashboard/maintenance/${planId}`} className="hover:text-gray-600 transition-colors">
          {(client as Record<string, unknown> | null)?.name as string ?? "Plan"}
        </Link>
        <span>/</span>
        <span className="text-gray-600">{monthLabel}</span>
      </div>

      <div className="mb-6">
        <h1 className="font-heading text-2xl text-gray-900">{monthLabel}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Mes {month.month_number}
          {(client as Record<string, unknown> | null)?.name
            ? ` · ${(client as Record<string, unknown>).name as string}`
            : ""}
        </p>
      </div>

      <MonthView
        month={month}
        prevMonth={prevMonth}
        taskStatuses={taskStatuses ?? []}
        planId={planId}
        clientName={(client as Record<string, unknown> | null)?.name as string ?? "Sin cliente"}
      />
    </div>
  );
}
