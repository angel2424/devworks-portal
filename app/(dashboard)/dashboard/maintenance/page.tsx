export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PlansTable, type PlanRow, type PlanMonth } from "@/components/dashboard/maintenance/Table";
import { Plus, PlusCircle } from "lucide-react";

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
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-heading text-xl md:text-2xl text-gray-900">Mantenimiento</h1>
          {plans.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
              {plans.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/maintenance/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-brand-500 active:bg-brand-600 hover:bg-brand-600 text-white rounded-lg transition-colors shrink-0"
        >
          <Plus size={'1rem'} />
          <span className="hidden sm:inline">Nuevo plan</span>
          <span className="sm:hidden">Nuevo</span>
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
