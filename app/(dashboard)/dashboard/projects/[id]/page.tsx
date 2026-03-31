export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TasksViewer,
  type TaskRow,
  type StatusInfo,
} from "@/components/dashboard/projects/TasksViewer";
import { DeleteProjectButton } from "./DeleteProjectButton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeClass(color: string | null) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-green-200";
    case "amber":
    case "yellow": return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "red":    return "bg-red-50 text-red-700 border-red-200";
    default:       return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const [year, month, day] = d.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project
  const { data: rawProject } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      created_at,
      status:catalog_status!status_id(id, label, color),
      client:clients!client_id(id, name, company),
      created_by_profile:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .single();

  if (!rawProject) notFound();

  const project = {
    ...rawProject,
    status: Array.isArray(rawProject.status)
      ? rawProject.status[0]
      : rawProject.status,
    client: Array.isArray(rawProject.client)
      ? rawProject.client[0] ?? null
      : rawProject.client ?? null,
    created_by_profile: Array.isArray(rawProject.created_by_profile)
      ? rawProject.created_by_profile[0] ?? null
      : rawProject.created_by_profile ?? null,
  };

  const [
    { data: rawTasks },
    { data: rawTaskStatuses },
    { data: rawPriorities },
    { data: rawTeam },
    { data: rawPhases },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(`
        id,
        title,
        description,
        due_date,
        estimated_duration,
        order_index,
        status:catalog_status!status_id(id, label, color),
        priority:catalog_status!priority_id(id, label, color),
        assigned:profiles!assigned_to(id, full_name),
        phase:phases!phase_id(id, name)
      `)
      .eq("project_id", id)
      .order("order_index", { ascending: true }),
    supabase
      .from("catalog_status")
      .select("id, label, color")
      .eq("category", "task_status")
      .order("order_index"),
    supabase
      .from("catalog_status")
      .select("id, label, color")
      .eq("category", "priority")
      .order("order_index"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "team")
      .order("full_name"),
    supabase
      .from("phases")
      .select("id, name, order_index")
      .eq("project_id", id)
      .order("order_index"),
  ]);

  const tasks: TaskRow[] = (rawTasks ?? []).map((t) => ({
    ...t,
    status:   Array.isArray(t.status)   ? t.status[0]            : t.status,
    priority: Array.isArray(t.priority) ? t.priority[0]          : t.priority,
    assigned: Array.isArray(t.assigned) ? t.assigned[0] ?? null  : t.assigned ?? null,
    phase:    Array.isArray(t.phase)    ? t.phase[0] ?? null      : t.phase ?? null,
  }));

  const taskStatuses = (rawTaskStatuses ?? []) as StatusInfo[];
  const priorities   = (rawPriorities  ?? []) as StatusInfo[];
  const teamMembers  = (rawTeam        ?? []) as { id: string; full_name: string | null }[];
  const phases       = (rawPhases      ?? []) as { id: string; name: string; order_index: number }[];

  // Derived stats
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status.color === "green").length;
  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const [y, m, d] = t.due_date.split("-").map(Number);
    return new Date(y, m - 1, d) < new Date() && t.status.color !== "green";
  }).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-7xl">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5 md:mb-7">
        <Link href="/dashboard/projects" className="hover:text-gray-600 active:text-gray-600 transition-colors shrink-0">
          Proyectos
        </Link>
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 font-medium truncate">{project.name}</span>
      </nav>

      {/* ── Project header ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 mb-5 md:mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.6}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-xl sm:text-2xl text-gray-900 truncate">{project.name}</h1>
              {project.client && (
                <Link
                  href={`/dashboard/clients/${project.client.id}`}
                  className="text-sm text-gray-500 hover:text-brand-600 active:text-brand-600 transition-colors truncate block"
                >
                  {project.client.name}
                  {project.client.company && ` · ${project.client.company}`}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={`text-xs font-medium px-2.5 py-1 ${statusBadgeClass(project.status?.color)}`}
            >
              {project.status?.label ?? "Sin estado"}
            </Badge>
            <DeleteProjectButton projectId={id} projectName={project.name} />
          </div>
        </div>

        {project.description && (
          <>
            <Separator className="my-4" />
            <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
          </>
        )}

        <Separator className="my-4 sm:my-5" />

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-4">
          <InfoField label="Fecha de inicio" value={formatDate(project.start_date)} />
          <InfoField label="Fecha de entrega" value={formatDate(project.end_date)} />
          <InfoField label="Creado por" value={project.created_by_profile?.full_name ?? "—"} />
          <InfoField label="Registrado" value={formatDate(project.created_at.split("T")[0])} />
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <>
            <Separator className="my-4 sm:my-5" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Progreso
                </span>
                <span className="text-xs font-semibold text-gray-600">
                  {doneTasks}/{totalTasks} · {progress}%
                  {overdueTasks > 0 && (
                    <span className="ml-2 text-red-500">· {overdueTasks} vencida{overdueTasks > 1 ? "s" : ""}</span>
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Tasks section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base sm:text-lg text-gray-900">Tareas</h2>
          <span className="text-xs text-gray-400">{totalTasks} {totalTasks === 1 ? "tarea" : "tareas"}</span>
        </div>
        <TasksViewer
          tasks={tasks}
          taskStatuses={taskStatuses}
          priorities={priorities}
          teamMembers={teamMembers}
          phases={phases}
        />
      </div>
    </div>
  );
}

// ─── InfoField ────────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}
