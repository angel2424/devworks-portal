export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import {
  ProjectsTable,
  type ProjectRow,
  type StatusOption,
} from "@/components/dashboard/projects/ProjectsTable";
import type { ClientOption } from "@/components/dashboard/projects/NewProjectModal";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [
    { data: rawProjects },
    { data: rawStatuses },
    { data: rawClients },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        created_at,
        status:catalog_status!status_id(id, label, color),
        client:clients!client_id(id, name, company)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("catalog_status")
      .select("id, label, color, is_default")
      .eq("category", "project")
      .order("order_index"),
    supabase
      .from("clients")
      .select("id, name, company")
      .order("name"),
  ]);

  const projects: ProjectRow[] = (rawProjects ?? []).map((p) => ({
    ...p,
    status: Array.isArray(p.status) ? p.status[0] : p.status,
    client: Array.isArray(p.client) ? p.client[0] ?? null : p.client ?? null,
  }));

  const statuses: StatusOption[] = (rawStatuses ?? []) as StatusOption[];
  const clients: ClientOption[]  = (rawClients ?? []) as ClientOption[];

  return (
    <div className="px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-gray-900">Proyectos</h1>
        <p className="text-sm text-gray-500">
          Gestión de proyectos activos y en pipeline.
        </p>
      </div>
      <ProjectsTable projects={projects} statuses={statuses} clients={clients} />
    </div>
  );
}
