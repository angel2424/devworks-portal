export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ClientsTable, type ClientRow, type StatusOption, type TeamMember } from "@/components/dashboard/clients/clients-table";

export default async function ClientsPage() {
  const supabase = await createClient();

  // Fetch all clients with status + assigned team member
  const { data: rawClients } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      email,
      phone,
      company,
      notes,
      created_at,
      status:catalog_status!status_id(id, label, color),
      assigned:profiles!assigned_to(id, full_name)
    `)
    .order("created_at", { ascending: false });

  // Status options for the filter (client pipeline only)
  const { data: rawStatuses } = await supabase
    .from("catalog_status")
    .select("id, label, color")
    .eq("category", "client")
    .order("order_index");

  // Team members for the assigned filter
  const { data: rawTeam } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "team")
    .order("full_name");

  // Normalize — Supabase returns joined rows as objects but TS types them as arrays
  const clients: ClientRow[] = (rawClients ?? []).map((c: any) => ({
    ...c,
    status: Array.isArray(c.status) ? c.status[0] : c.status,
    assigned: Array.isArray(c.assigned)
      ? c.assigned[0] ?? null
      : c.assigned ?? null,
  }));

  const statuses: StatusOption[] = (rawStatuses ?? []) as StatusOption[];
  const teamMembers: TeamMember[] = (rawTeam ?? []) as TeamMember[];

  return (
    <div className="px-8 py-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-1">
          CRM — Clientes
        </h1>
        <p className="text-sm text-gray-500">
          Pipeline de prospectos y gestión de clientes activos.
        </p>
      </div>

      <ClientsTable
        clients={clients}
        statuses={statuses}
        teamMembers={teamMembers}
      />
    </div>
  );
}
