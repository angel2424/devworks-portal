export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PlansTable, type PlanRow, type PlanMonth } from "./components/PlansTable";

export default async function MaintenancePage() {
  const supabase = await createClient();

  const [{ data: rawPlans }, { data: statuses }, { data: clients }] = await Promise.all([
    supabase
      .from("maintenance_plans")
      .select(`
        id, type, start_date, end_date, created_at,
        client:clients(id, name, company),
        status:catalog_status!status_id(id, label, color, value),
        months:maintenance_months(id, month_number, year, month, status)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("catalog_status")
      .select("id, label, color, value")
      .eq("category", "maintenance")
      .order("order_index"),
    supabase
      .from("clients")
      .select("id, name, company")
      .order("name"),
  ]);

  const plans: PlanRow[] = (rawPlans ?? []).map((p) => ({
    id: p.id,
    type: p.type as "spt" | "recurring",
    start_date: p.start_date,
    end_date: p.end_date,
    created_at: p.created_at,
    client: Array.isArray(p.client) ? (p.client[0] ?? null) : (p.client ?? null),
    status: Array.isArray(p.status) ? (p.status[0] ?? null) : (p.status ?? null),
    months: ((p.months as PlanMonth[]) ?? []).sort(
      (a, b) => a.month_number - b.month_number
    ),
  }));

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl text-gray-900">Mantenimiento</h1>
          {plans.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {plans.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/maintenance/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo plan
        </Link>
      </div>

      <PlansTable
        plans={plans}
        statuses={statuses ?? []}
        clients={clients ?? []}
      />
    </div>
  );
}
