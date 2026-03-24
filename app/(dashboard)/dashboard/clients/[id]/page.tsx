export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ClientDetailTabs,
  type ProjectItem,
  type TaskItem,
} from "@/components/dashboard/clients/client-detail-tabs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeClass(color: string | null) {
  switch (color) {
    case "green":
      return "bg-green-50 text-green-700 border-green-200";
    case "amber":
    case "yellow":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "red":
      return "bg-red-50 text-red-700 border-red-200";
    case "purple":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch client
  const { data: rawClient } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      email,
      phone,
      company,
      notes,
      created_at,
      updated_at,
      status:catalog_status!status_id(id, label, color),
      assigned:profiles!assigned_to(id, full_name),
      created_by_profile:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .single();

  if (!rawClient) notFound();

  const client = {
    ...rawClient,
    status: Array.isArray(rawClient.status)
      ? rawClient.status[0]
      : rawClient.status,
    assigned: Array.isArray(rawClient.assigned)
      ? rawClient.assigned[0] ?? null
      : rawClient.assigned ?? null,
    created_by_profile: Array.isArray(rawClient.created_by_profile)
      ? rawClient.created_by_profile[0] ?? null
      : rawClient.created_by_profile ?? null,
  };

  // Fetch projects
  const { data: rawProjects } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      created_at,
      status:catalog_status!status_id(id, label, color)
    `)
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const projects: ProjectItem[] = (rawProjects ?? []).map((p: any) => ({
    ...p,
    status: Array.isArray(p.status) ? p.status[0] : p.status,
  }));

  // Fetch tasks (for all projects belonging to this client)
  const projectIds = projects.map((p) => p.id);
  let tasks: TaskItem[] = [];

  if (projectIds.length > 0) {
    const { data: rawTasks } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        due_date,
        created_at,
        status:catalog_status!status_id(id, label, color),
        priority:catalog_status!priority_id(id, label, color),
        assigned:profiles!assigned_to(id, full_name),
        project:projects!project_id(id, name)
      `)
      .in("project_id", projectIds)
      .order("due_date", { ascending: true, nullsFirst: false });

    tasks = (rawTasks ?? []).map((t: any) => ({
      ...t,
      status: Array.isArray(t.status) ? t.status[0] : t.status,
      priority: Array.isArray(t.priority) ? t.priority[0] : t.priority,
      assigned: Array.isArray(t.assigned)
        ? t.assigned[0] ?? null
        : t.assigned ?? null,
      project: Array.isArray(t.project)
        ? t.project[0] ?? null
        : t.project ?? null,
    }));
  }

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="px-8 py-8 max-w-6xl">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-7">
        <Link
          href="/dashboard/clients"
          className="hover:text-gray-600 transition-colors"
        >
          Clientes
        </Link>
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 font-medium">{client.name}</span>
      </nav>

      {/* ── Header card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-xl flex-shrink-0">
              <AvatarFallback className="rounded-xl text-lg font-semibold bg-brand-50 text-brand-600">
                {initials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-1">
                {client.name}
              </h1>
              {client.company && (
                <p className="text-sm text-gray-500">{client.company}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={`text-xs font-medium px-2.5 py-1 ${statusBadgeClass(
                client.status?.color
              )}`}
            >
              {client.status?.label ?? "Sin estado"}
            </Badge>
            <Button variant="outline" size="sm" className="h-8 text-sm border-gray-200" asChild>
              <Link href={`/dashboard/clients/${id}/edit`}>Editar</Link>
            </Button>
          </div>
        </div>

        <Separator className="my-5" />

        {/* Contact info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <InfoField
            label="Email"
            value={
              client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="text-brand-600 hover:underline"
                >
                  {client.email}
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoField
            label="Teléfono"
            value={
              client.phone ? (
                <a href={`tel:${client.phone}`} className="hover:underline">
                  {client.phone}
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoField
            label="Responsable"
            value={
              client.assigned ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[9px] bg-brand-100 text-brand-700">
                      {initials(client.assigned.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{client.assigned.full_name ?? "—"}</span>
                </div>
              ) : (
                "Sin asignar"
              )
            }
          />
          <InfoField label="Registrado" value={formatDate(client.created_at)} />
        </div>

        {/* Notes */}
        {client.notes && (
          <>
            <Separator className="my-5" />
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Notas
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Tabs section ── */}
      <ClientDetailTabs projects={projects} tasks={tasks} />
    </div>
  );
}

// ─── InfoField ────────────────────────────────────────────────────────────────

function InfoField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}
