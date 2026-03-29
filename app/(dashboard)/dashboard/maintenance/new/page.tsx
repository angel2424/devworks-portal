export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NewPlanForm } from "@/components/dashboard/maintenance/NewPlanForm";

export default async function NewMaintenancePlanPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company")
      .order("name"),
    supabase
      .from("projects")
      .select("id, name, client_id")
      .order("name"),
  ]);

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/maintenance"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Mantenimiento
        </Link>
        <h1 className="font-heading text-2xl text-gray-900">Nuevo plan de mantenimiento</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura el tipo, cliente y fecha de inicio. Las tareas mensuales se generan automáticamente.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <NewPlanForm
          clients={clients ?? []}
          projects={(projects ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            client_id: p.client_id ?? null,
          }))}
        />
      </div>
    </div>
  );
}
