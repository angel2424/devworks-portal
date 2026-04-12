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
import { Plus } from "lucide-react";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_COLOR,
  DELIVERABLE_TYPE_LABEL,
} from "@/lib/deliverables/types";
import type { DeliverableStatus, DeliverableType } from "@/lib/deliverables/types";

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
};

export type MaintenancePlan = {
  id: string;
  type: "spt" | "recurring";
  start_date: string | null;
  end_date: string | null;
  status: StatusInfo | null;
  months: {
    id: string;
    month_number: number;
    year: number;
    month: string;
    status: string;
  }[];
};

export type DeliverableListItem = {
  id: string;
  type: DeliverableType;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  published_at: string | null;
  submitted_at: string | null;
  created_at: string;
  fields: { id: string }[];
  options: { id: string }[];
};

type Props = {
  clientId: string;
  project: ProjectItem | null;
  tasks: TaskItem[];
  maintenancePlans: MaintenancePlan[];
  deliverables: DeliverableListItem[];
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

function monthStatusColor(status: string) {
  switch (status) {
    case "done":
    case "complete":
    case "completed":
      return "bg-green-400";
    case "in_progress":
    case "active":
      return "bg-brand-400";
    case "pending":
    default:
      return "bg-gray-200";
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

const planTypeLabel: Record<MaintenancePlan["type"], string> = {
  spt: "SPT",
  recurring: "Recurrente",
};

// ─── Empty state ──────────────────────────────────────────────────────────────

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

export function ClientDetailTabs({
  clientId,
  project,
  tasks,
  maintenancePlans,
  deliverables,
}: Props) {
  const openTasks = tasks.filter(
    (t) => t.status.color !== "gray" && t.status.color !== "green"
  );

  return (
    <Tabs defaultValue={project ? "project" : "maintenance"} className="space-y-6">
      <TabsList className="h-9 bg-gray-100 p-1 rounded-lg">
        <TabsTrigger
          value="project"
          className="text-sm px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs"
        >
          Proyecto
          {tasks.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
              {tasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="maintenance"
          className="text-sm px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs"
        >
          Mantenimiento
          {maintenancePlans.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
              {maintenancePlans.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="deliverables"
          className="text-sm px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs"
        >
          Entregables
          {deliverables.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
              {deliverables.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* ── Proyecto ── */}
      <TabsContent value="project" className="mt-0 space-y-4">
        {!project ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            <EmptyCard
              message="Sin proyecto"
              sub="Este cliente todavía no tiene un proyecto asignado."
            />
          </div>
        ) : (
          <>
            {/* Project card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="font-medium text-gray-900 hover:text-brand-600 hover:underline transition-colors"
                  >
                    {project.name}
                  </Link>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-1 leading-snug">
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

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
                <span>
                  <span className="text-gray-400">Inicio:</span>{" "}
                  {formatDate(project.start_date)}
                </span>
                <span>
                  <span className="text-gray-400">Entrega:</span>{" "}
                  {formatDate(project.end_date)}
                </span>
                {openTasks.length > 0 && (
                  <span className="text-amber-600 font-medium">
                    {openTasks.length} tarea{openTasks.length !== 1 ? "s" : ""}{" "}
                    abierta{openTasks.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Tasks */}
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white">
                <EmptyCard
                  message="Sin tareas"
                  sub="No hay tareas registradas para este proyecto."
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
                            <span className="text-xs text-gray-500">
                              {task.assigned.full_name}
                            </span>
                          </div>
                        )}
                        {task.due_date && (
                          <span
                            className={`text-xs ml-auto font-medium ${
                              isOverdue(task.due_date)
                                ? "text-red-500"
                                : "text-gray-400"
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
                            <span className="text-sm text-gray-800">
                              {task.title}
                            </span>
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
          </>
        )}
      </TabsContent>

      {/* ── Mantenimiento ── */}
      <TabsContent value="maintenance" className="mt-0 space-y-3">
        {maintenancePlans.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            <EmptyCard
              message="Sin planes de mantenimiento"
              sub="Este cliente todavía no tiene planes de mantenimiento registrados."
            />
          </div>
        ) : (
          maintenancePlans.map((plan) => {
            const doneCount = plan.months.filter((m) =>
              ["done", "complete", "completed"].includes(m.status)
            ).length;
            const total = plan.months.length;

            return (
              <Link
                key={plan.id}
                href={`/dashboard/maintenance/${plan.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {planTypeLabel[plan.type]}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatDate(plan.start_date)}
                      {plan.end_date && ` → ${formatDate(plan.end_date)}`}
                    </span>
                  </div>
                  {plan.status && (
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${statusBadgeClass(plan.status.color)}`}
                    >
                      {plan.status.label}
                    </Badge>
                  )}
                </div>

                {/* Month progress dots */}
                {total > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {plan.months.map((m) => (
                      <div
                        key={m.id}
                        title={`${m.month} ${m.year} — ${m.status}`}
                        className={`w-2.5 h-2.5 rounded-full ${monthStatusColor(m.status)}`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      {doneCount}/{total} meses completados
                    </span>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </TabsContent>
      {/* ── Entregables ── */}
      <TabsContent value="deliverables" className="mt-0 space-y-3">
        <div className="flex items-center justify-end mb-1">
          <Link
            href={`/dashboard/clients/${clientId}/deliverables/new`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md px-3 py-1.5 hover:border-gray-300 bg-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo entregable
          </Link>
        </div>

        {deliverables.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            <EmptyCard
              message="Sin entregables"
              sub="Crea un formulario o página de decisión para compartir con el cliente."
            />
          </div>
        ) : (
          deliverables.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/clients/${clientId}/deliverables/${d.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {DELIVERABLE_TYPE_LABEL[d.type]}
                    </span>
                    <span
                      className={`text-xs border rounded-full px-2 py-0.5 font-medium ${DELIVERABLE_STATUS_COLOR[d.status]}`}
                    >
                      {DELIVERABLE_STATUS_LABEL[d.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{d.title}</p>
                  {d.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
                      {d.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">
                    {d.type === "form"
                      ? `${d.fields.length} campo${d.fields.length !== 1 ? "s" : ""}`
                      : `${d.options.length} opcion${d.options.length !== 1 ? "es" : ""}`}
                  </p>
                  {d.submitted_at && (
                    <p className="text-xs text-amber-600 font-medium mt-0.5">
                      Respondido {formatDate(d.submitted_at)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
