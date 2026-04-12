export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import StatCard from "@/components/dashboard/StatCard"
import QuickAction from "@/components/dashboard/QuickAction"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import TodaysTasks from "@/components/dashboard/TodaysTasks"
import { FolderPlus, SquareArrowOutUpRight, UserPlus } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single()

  const firstName = profile?.full_name ?? user?.email?.split("@")[0] ?? "equipo"

  const today = new Date().toISOString().split("T")[0]

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
    ])

  const doneTaskIds = (doneTaskStatuses ?? []).map((s: { id: string }) => s.id)
  const doneProjectIds = (doneProjectStatuses ?? []).map(
    (s: { id: string }) => s.id
  )

  const [activeProjectsResult, expiredTasksResult, openTasksResult] =
    await Promise.all([
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
    ])

  const activeProjects = activeProjectsResult.count ?? 0
  const expiredTasks = expiredTasksResult.count ?? 0
  const openTasks = openTasksResult.count ?? 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="font-heading mb-1 text-xl text-gray-900 md:text-2xl">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-gray-500">
          Aquí está el resumen de tu espacio de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Proyectos activos"
          value={activeProjects}
          sublabel="En este momento"
        />
        <StatCard
          label="Tareas abiertas"
          value={openTasks}
          sublabel="Asignadas a mí"
          href="/dashboard/tasks?me=true"
        />
        <StatCard
          label="Tareas vencidas"
          value={expiredTasks}
          sublabel="Sin completar"
          warning={expiredTasks > 0}
          href="/dashboard/tasks?expired=true&me=true"
        />
      </div>
      <div className="w-full">
        <h2 className="font-heading mb-4 text-base text-gray-900">
          Acciones rápidas
        </h2>
        <div className="flex w-full flex-col items-center gap-4 md:flex-row">
          <QuickAction
            label="Nuevo cliente"
            description="Agregar al CRM"
            href="/dashboard/clients/new"
            icon={<UserPlus size={"1rem"} />}
          />
          <QuickAction
            label="Nuevo proyecto"
            description="Iniciar un proyecto"
            href="/dashboard/projects/new"
            icon={<FolderPlus size={"1rem"} />}
          />
          <QuickAction
            label="Portal del cliente"
            description="Ver como cliente"
            href="/portal"
            icon={<SquareArrowOutUpRight size={"1rem"} />}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse items-start gap-5 md:gap-6 lg:flex-row">
        <TodaysTasks userId={user?.id} />
        <div className="w-full flex-1 space-y-6 md:space-y-8">
          <div>
            <h2 className="font-heading mb-4 text-base text-gray-900">
              Próximos vencimientos
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <svg
                      className="h-5 w-5 text-gray-500"
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
  )
}
