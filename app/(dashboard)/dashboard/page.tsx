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
import TodaysTasks from "@/components/dashboard/TodaysTasks";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  console.log(profile)
  const firstName =
    profile?.full_name ??
    user?.email?.split("@")[0] ??
    "equipo";

  const today = new Date().toISOString().split("T")[0];

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

  const [
    activeProjectsResult,
    expiredTasksResult,
    openTasksResult,
  ] = await Promise.all([
    doneProjectIds.length
      ? supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .not("status_id", "in", `(${doneProjectIds.join(",")})`)
      : supabase.from("projects").select("*", { count: "exact", head: true }),

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
  ]);

  const activeProjects = activeProjectsResult.count ?? 0;
  const expiredTasks = expiredTasksResult.count ?? 0;
  const openTasks = openTasksResult.count ?? 0;

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      <div className="mb-7 md:mb-10">
        <h1 className="font-heading text-xl md:text-2xl text-gray-900 mb-1">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-gray-500">
          Aquí está el resumen de tu espacio de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
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

      <div className="flex flex-col-reverse lg:flex-row items-start gap-5 md:gap-6">
        <TodaysTasks userId={user?.id} />
        <div className="flex-1 w-full space-y-6 md:space-y-8">
          <div className="">
            <h2 className="font-heading text-base text-gray-900 mb-4">
              Acciones rápidas
            </h2>
            <div className="flex flex-col w-full gap-4">
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
