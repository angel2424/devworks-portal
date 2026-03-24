"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusInfo = {
  id: string;
  label: string;
  color: string | null;
};

export type ProjectItem = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  status: StatusInfo;
};

export type TaskItem = {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  status: StatusInfo;
  priority: StatusInfo;
  assigned: { id: string; full_name: string | null } | null;
  project: { id: string; name: string } | null;
};

type Props = {
  projects: ProjectItem[];
  tasks: TaskItem[];
};

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
    case "gray":
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function isOverdue(due: string | null) {
  if (!due) return false;
  return new Date(due) < new Date();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyCard({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{message}</p>
      <p className="text-xs text-gray-400 max-w-xs">{sub}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClientDetailTabs({ projects, tasks }: Props) {
  // Derived stats
  const activeProjects = projects.filter(
    (p) => p.status.color !== "gray" && p.status.color !== "red"
  );
  const openTasks = tasks.filter(
    (t) => t.status.color !== "gray" && t.status.color !== "green"
  );
  const overdueTasks = tasks.filter((t) => isOverdue(t.due_date));
  const nextDeadline = tasks
    .filter((t) => t.due_date && !isOverdue(t.due_date))
    .sort(
      (a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    )[0];

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="h-9 bg-gray-100 p-1 rounded-lg">
        <TabsTrigger value="overview" className="text-sm px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs">
          Resumen
        </TabsTrigger>
        <TabsTrigger value="projects" className="text-sm px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs">
          Proyectos
          {projects.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 data-[state=active]:bg-brand-100 data-[state=active]:text-brand-700 rounded-full px-1.5 py-0.5">
              {projects.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="tasks" className="text-sm px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs">
          Tareas
          {tasks.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
              {tasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="payments" className="text-sm px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs">
          Pagos
        </TabsTrigger>
      </TabsList>

      {/* ── Overview ── */}
      <TabsContent value="overview" className="mt-0 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Proyectos activos"
            value={activeProjects.length}
            color="brand"
          />
          <StatCard
            label="Tareas abiertas"
            value={openTasks.length}
            color={openTasks.length > 0 ? "amber" : "default"}
          />
          <StatCard
            label="Tareas vencidas"
            value={overdueTasks.length}
            color={overdueTasks.length > 0 ? "red" : "default"}
          />
          <StatCard
            label="Próx. vencimiento"
            value={nextDeadline ? formatDate(nextDeadline.due_date) : "—"}
            color="default"
            small
          />
        </div>

        {/* Recent tasks */}
        {openTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Tareas abiertas recientes
            </h3>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
              {openTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {task.title}
                    </p>
                    {task.project && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {task.project.name}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${statusBadgeClass(
                      task.status.color
                    )}`}
                  >
                    {task.status.label}
                  </Badge>
                  {task.due_date && (
                    <span
                      className={`text-xs shrink-0 ${
                        isOverdue(task.due_date)
                          ? "text-red-500 font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending payments placeholder */}
        <div>
          <h3 className="text-base  text-gray-700 mb-3">
            Pagos pendientes
          </h3>
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
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
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                Módulo de pagos — Próximamente
              </p>
              <p className="text-xs text-gray-400">
                Aquí aparecerán los pagos y facturas del cliente.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ── Projects ── */}
      <TabsContent value="projects" className="mt-0">
        {projects.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            <EmptyCard
              message="Sin proyectos"
              sub="Este cliente todavía no tiene proyectos asignados."
            />
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-brand-600 transition-colors hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${statusBadgeClass(project.status.color)}`}
                    >
                      {project.status.label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <span>Inicio: {formatDate(project.start_date)}</span>
                    <span>Entrega: {formatDate(project.end_date)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border border-gray-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-5">
                      Proyecto
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Inicio
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pr-5">
                      Entrega
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="group hover:bg-brand-50/30 transition-colors"
                    >
                      <TableCell className="pl-5 py-3.5">
                        <div>
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClass(project.status.color)}`}
                        >
                          {project.status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-xs text-gray-500">
                          {formatDate(project.start_date)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 pr-5">
                        <span className="text-xs text-gray-500">
                          {formatDate(project.end_date)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </TabsContent>

      {/* ── Tasks ── */}
      <TabsContent value="tasks" className="mt-0">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            <EmptyCard
              message="Sin tareas"
              sub="No hay tareas registradas para los proyectos de este cliente."
            />
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {task.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${statusBadgeClass(task.status.color)}`}
                    >
                      {task.status.label}
                    </Badge>
                  </div>

                  <div className="mt-2.5 flex items-center flex-wrap gap-2">
                    {task.project && (
                      <Link
                        href={`/dashboard/projects/${task.project.id}`}
                        className="text-xs text-gray-500 hover:text-brand-600 hover:underline transition-colors"
                      >
                        {task.project.name}
                      </Link>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusBadgeClass(task.priority.color)}`}
                    >
                      {task.priority.label}
                    </Badge>
                    {task.assigned && (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4 shrink-0">
                          <AvatarFallback className="text-[9px] bg-brand-100 text-brand-700">
                            {initials(task.assigned.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{task.assigned.full_name}</span>
                      </div>
                    )}
                    {task.due_date && (
                      <span
                        className={`text-xs ml-auto font-medium ${
                          isOverdue(task.due_date) ? "text-red-500" : "text-gray-400"
                        }`}
                      >
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border border-gray-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-5">
                      Tarea
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Proyecto
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Responsable
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pr-5">
                      Vence
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <TableCell className="pl-5 py-3.5">
                        <span className="text-sm text-gray-800">{task.title}</span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {task.project ? (
                          <Link
                            href={`/dashboard/projects/${task.project.id}`}
                            className="text-xs text-gray-500 hover:text-brand-600 hover:underline transition-colors"
                          >
                            {task.project.name}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClass(task.status.color)}`}
                        >
                          {task.status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClass(task.priority.color)}`}
                        >
                          {task.priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {task.assigned ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarFallback className="text-[10px] bg-brand-100 text-brand-700">
                                {initials(task.assigned.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-600">
                              {task.assigned.full_name ?? "—"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 pr-5">
                        <span
                          className={`text-xs ${
                            isOverdue(task.due_date)
                              ? "text-red-500 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </TabsContent>

      {/* ── Payments ── */}
      <TabsContent value="payments" className="mt-0">
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">
              Módulo de pagos — Próximamente
            </p>
            <p className="text-xs text-gray-400 max-w-sm">
              Aquí podrás ver el historial de pagos, facturas pendientes y
              registrar nuevos cobros para este cliente.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = "default",
  small = false,
}: {
  label: string;
  value: string | number;
  color?: "brand" | "amber" | "red" | "default";
  small?: boolean;
}) {
  const valueClass = {
    brand: "text-brand-600",
    amber: "text-amber-600",
    red: "text-red-500",
    default: "text-gray-900",
  }[color];

  const bgClass = {
    brand: "bg-brand-50 border-brand-100",
    amber: "bg-amber-50 border-amber-100",
    red: "bg-red-50 border-red-100",
    default: "bg-white border-gray-200",
  }[color];

  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-2 ${bgClass}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
        {label}
      </p>
      <p
        className={`font-heading font-semibold ${
          small ? "text-lg" : "text-3xl"
        } ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}
