export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ClientsTable, type ClientRow, type StatusOption, type TeamMember } from "@/components/dashboard/clients/Table";

export default async function ClientsPage() {
  const supabase = await createClient();

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

  const { data: rawStatuses } = await supabase
    .from("catalog_status")
    .select("id, label, color")
    .eq("category", "client")
    .order("order_index");

  const { data: rawTeam } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "team")
    .order("full_name");

  const clients: ClientRow[] = (rawClients ?? []).map((c) => ({
    ...c,
    status: Array.isArray(c.status) ? c.status[0] : c.status,
    assigned: Array.isArray(c.assigned)
      ? c.assigned[0] ?? null
      : c.assigned ?? null,
  }));

  const statuses: StatusOption[] = (rawStatuses ?? []) as StatusOption[];
  const teamMembers: TeamMember[] = (rawTeam ?? []) as TeamMember[];

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-7xl">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-xl md:text-2xl text-gray-900">
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
