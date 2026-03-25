export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import QuickAction from "@/components/dashboard/QuickAction";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

type TodayTask = {
  id: string;
  title: string;
  project: { id: string; name: string } | null;
  status: { label: string; color: string; value: string } | null;
  priority: { label: string; color: string; value: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "equipo";

  const today = new Date().toISOString().split("T")[0];

  // Fetch terminal status IDs to exclude from counts
  const [{ data: doneTaskStatuses }, { data: doneProjectStatuses }] =
    await Promise.all([
      supabase
        .from("catalog_status")
        .select("id")
        .eq("category", "task_status")
        .eq("value", "done"),
      supabase
        .from("catalog_status")
        .select("id")
        .eq("category", "project")
        .in("value", ["done", "cancelled"]),
    ]);

  const doneTaskIds = (doneTaskStatuses ?? []).map((s: { id: string }) => s.id);
  const doneProjectIds = (doneProjectStatuses ?? []).map(
    (s: { id: string }) => s.id
  );

  // Parallel data queries
  const [
    activeProjectsResult,
    expiredTasksResult,
    openTasksResult,
    todayTasksResult,
  ] = await Promise.all([
    // Active projects (exclude done/cancelled)
    doneProjectIds.length
      ? supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .not("status_id", "in", `(${doneProjectIds.join(",")})`)
      : supabase.from("projects").select("*", { count: "exact", head: true }),

    // Expired tasks: due_date < today, not done
    doneTaskIds.length
      ? supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .lt("due_date", today)
          .not("status_id", "in", `(${doneTaskIds.join(",")})`)
      : supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .lt("due_date", today),

    // Open tasks assigned to the current user: not done
    doneTaskIds.length
      ? supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", user?.id ?? "")
          .not("status_id", "in", `(${doneTaskIds.join(",")})`)
      : supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", user?.id ?? ""),

    // Today's tasks assigned to the current user
    supabase
      .from("tasks")
      .select(
        `
        id, title,
        project:projects(id, name),
        status:catalog_status!status_id(label, color, value),
        priority:catalog_status!priority_id(label, color, value)
      `
      )
      .eq("assigned_to", user?.id ?? "")
      .eq("due_date", today)
      .order("order_index"),
  ]);

  const activeProjects = activeProjectsResult.count ?? 0;
  const expiredTasks = expiredTasksResult.count ?? 0;
  const openTasks = openTasksResult.count ?? 0;
  const todayTasks = (todayTasksResult.data ?? []) as TodayTask[];

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="font-heading text-2xl text-gray-900 mb-1">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-gray-500">
          Aquí está el resumen de tu espacio de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Proyectos activos"
          value={activeProjects}
          sublabel="En este momento"
          accent
        />
        <StatCard
          label="Tareas vencidas"
          value={expiredTasks}
          sublabel="Sin completar"
          warning={expiredTasks > 0}
          href="/dashboard/tasks?expired=true&me=true"
        />
        <StatCard
          label="Tareas abiertas"
          value={openTasks}
          sublabel="Asignadas a mí"
          href="/dashboard/tasks?me=true"
        />
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base text-gray-900">
              Mis Tareas de Hoy
            </h2>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {todayTasks.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </EmptyMedia>
                  <EmptyTitle>Sin tareas para hoy</EmptyTitle>
                  <EmptyDescription>
                    No tienes tareas con vencimiento hoy.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y divide-gray-100">
                {todayTasks.map((task) => {
                  const dotColor =
                    task.status?.color?.startsWith("#")
                      ? task.status.color
                      : "#d1d5db";
                  const priorityBg =
                    task.priority?.color?.startsWith("#")
                      ? `${task.priority.color}20`
                      : "#f3f4f6";
                  const priorityText =
                    task.priority?.color?.startsWith("#")
                      ? task.priority.color
                      : "#6b7280";

                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        {task.project && (
                          <p className="text-xs text-gray-400 truncate">
                            {task.project.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {task.priority && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: priorityBg,
                              color: priorityText,
                            }}
                          >
                            {task.priority.label}
                          </span>
                        )}
                        {task.status && (
                          <span className="text-xs text-gray-400">
                            {task.status.label}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div>
            <h2 className="font-heading text-base text-gray-900 mb-4">
              Acciones rápidas
            </h2>
            <div className="space-y-2">
              <QuickAction
                label="Nuevo cliente"
                description="Agregar al CRM"
                href="/dashboard/clients/new"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                    />
                  </svg>
                }
              />
              <QuickAction
                label="Nuevo proyecto"
                description="Iniciar un proyecto"
                href="/dashboard/projects/new"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                    />
                  </svg>
                }
              />
              <QuickAction
                label="Portal del cliente"
                description="Ver como cliente"
                href="/portal"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                }
              />
            </div>
          </div>

          <div>
            <h2 className="font-heading text-base text-gray-900 mb-4">
              Próximos vencimientos
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                  </EmptyMedia>
                  <EmptyTitle>Sin vencimientos</EmptyTitle>
                  <EmptyDescription>
                    Los vencimientos de tareas aparecerán aquí.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
