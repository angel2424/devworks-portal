"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusInfo = {
  id: string;
  label: string;
  color: string | null;
  value: string;
};

export type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  project: { id: string; name: string } | null;
  status: StatusInfo | null;
  priority: StatusInfo | null;
  assignee: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

// kept for any existing imports
export type StatusGroup = {
  status: TaskRow["status"];
  tasks: TaskRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeClass(color: string | null | undefined) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-green-200";
    case "amber":
    case "yellow": return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "red":    return "bg-red-50 text-red-700 border-red-200";
    default:       return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function priorityBadgeClass(color: string | null | undefined) {
  return statusBadgeClass(color);
}

function formatDueDate(dateStr: string | null, isDone = false): {
  label: string;
  state: "expired" | "today" | "soon" | "normal" | "none";
} {
  if (!dateStr) return { label: "Sin fecha", state: "none" };
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  if (diffDays < 0)  return { label, state: isDone ? "normal" : "expired" };
  if (diffDays === 0) return { label: "Hoy", state: "today" };
  if (diffDays <= 3)  return { label, state: "soon" };
  return { label, state: "normal" };
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Cycle Button ─────────────────────────────────────────────────────────────

function CycleButton({
  color,
  isPending,
  onClick,
}: {
  color: string | null | undefined;
  isPending: boolean;
  onClick: () => void;
}) {
  const isDone  = color === "green";
  const isAmber = color === "amber" || color === "yellow";
  const isRed   = color === "red";
  const isBlue  = color === "blue";

  const base = "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all focus:outline-none";

  if (isPending) {
    return (
      <button disabled className={`${base} border-gray-200 bg-white cursor-wait`}>
        <svg className="w-2.5 h-2.5 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </button>
    );
  }

  if (isDone) return (
    <button onClick={onClick} title="Cambiar estado" className={`${base} border-green-500 bg-green-500 text-white hover:bg-green-600 hover:border-green-600`}>
      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );

  if (isAmber) return (
    <button onClick={onClick} title="Cambiar estado" className={`${base} border-amber-400 bg-amber-50 hover:bg-amber-100`}>
      <span className="w-2 h-2 rounded-full bg-amber-400" />
    </button>
  );

  if (isRed) return (
    <button onClick={onClick} title="Cambiar estado" className={`${base} border-red-400 bg-red-50 hover:bg-red-100`}>
      <svg className="w-2.5 h-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
      </svg>
    </button>
  );

  if (isBlue) return (
    <button onClick={onClick} title="Cambiar estado" className={`${base} border-blue-400 bg-blue-50 hover:bg-blue-100`}>
      <span className="w-2 h-2 rounded-full bg-blue-400" />
    </button>
  );

  // empty ring (gray / pending)
  return (
    <button onClick={onClick} title="Cambiar estado" className={`${base} border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50`} />
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRowItem({
  task,
  taskStatuses,
  onUpdate,
}: {
  task: TaskRow;
  taskStatuses: StatusInfo[];
  onUpdate: (id: string, db: Record<string, unknown>, local: Partial<TaskRow>) => void;
}) {
  const [isCycling, startCycle] = useTransition();
  const isDone = task.status?.color === "green";
  const due = formatDueDate(task.due_date, isDone);

  function cycleStatus() {
    const currentIdx = taskStatuses.findIndex((s) => s.id === task.status?.id);
    const next = taskStatuses[(currentIdx + 1) % taskStatuses.length];
    if (!next) return;
    startCycle(() => onUpdate(task.id, { status_id: next.id }, { status: next }));
  }

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors group">
      {/* Cycle button */}
      <td className="pl-10 pr-2 py-2.5 w-8">
        <CycleButton color={task.status?.color} isPending={isCycling} onClick={cycleStatus} />
      </td>

      {/* Title */}
      <td className="px-2 py-2.5 min-w-[200px]">
        <span className={cn(
          "text-sm font-medium",
          isDone ? "line-through text-gray-400" : "text-gray-800"
        )}>
          {task.title}
        </span>
      </td>

      {/* Project */}
      <td className="px-4 py-2.5">
        {task.project ? (
          <Link
            href={`/dashboard/projects/${task.project.id}`}
            className="text-xs text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 truncate block max-w-[160px]"
          >
            {task.project.name}
          </Link>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Status — Select for rollback */}
      <td className="px-4 py-2.5">
        <Select
          value={task.status?.id ?? ""}
          onValueChange={(val) => {
            const s = taskStatuses.find((x) => x.id === val);
            if (s) onUpdate(task.id, { status_id: val }, { status: s });
          }}
        >
          <SelectTrigger className="h-auto border-0 shadow-none p-0 focus:ring-0 w-auto gap-0 [&>svg]:hidden">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium px-2 py-0.5 cursor-pointer hover:opacity-75 transition-opacity",
                statusBadgeClass(task.status?.color)
              )}
            >
              {task.status?.label ?? "—"}
            </Badge>
          </SelectTrigger>
          <SelectContent position="popper">
            {taskStatuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Priority */}
      <td className="px-4 py-2.5">
        {task.priority ? (
          <Badge
            variant="outline"
            className={cn("text-xs font-medium px-2 py-0.5", priorityBadgeClass(task.priority.color))}
          >
            {task.priority.label}
          </Badge>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Due date */}
      <td className="px-4 py-2.5">
        <span className={cn(
          "text-xs font-medium",
          due.state === "expired" && "text-red-600",
          due.state === "today"   && "text-amber-600",
          due.state === "soon"    && "text-amber-500",
          due.state === "normal"  && "text-gray-600",
          due.state === "none"    && "text-gray-400",
        )}>
          {due.label}
        </span>
      </td>

      {/* Assignee */}
      <td className="px-4 py-2.5 pr-5">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            {task.assignee.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.assignee.avatar_url}
                alt={task.assignee.full_name ?? ""}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                {getInitials(task.assignee.full_name)}
              </span>
            )}
            <span className="text-xs text-gray-600 truncate hidden xl:block max-w-[80px]">
              {task.assignee.full_name?.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaskGroups({
  tasks: initialTasks,
  taskStatuses,
}: {
  tasks: TaskRow[];
  taskStatuses: StatusInfo[];
}) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function updateTask(id: string, db: Record<string, unknown>, local: Partial<TaskRow>) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...local } : t));
    const supabase = createClient();
    supabase.from("tasks").update(db).eq("id", id).then(({ error }) => {
      if (error) console.error("Error updating task:", error.message);
    });
  }

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Derive groups from live task state, preserving catalog order
  const statusOrder = new Map(taskStatuses.map((s, i) => [s.id, i]));
  const groupMap = new Map<string, { status: TaskRow["status"]; tasks: TaskRow[] }>();
  for (const task of tasks) {
    const key = task.status?.id ?? "__none__";
    if (!groupMap.has(key)) groupMap.set(key, { status: task.status, tasks: [] });
    groupMap.get(key)!.tasks.push(task);
  }
  const groups = [...groupMap.values()].sort((a, b) => {
    const ai = a.status ? (statusOrder.get(a.status.id) ?? 999) : 999;
    const bi = b.status ? (statusOrder.get(b.status.id) ?? 999) : 999;
    return ai - bi;
  });

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="w-8 pl-10 pr-2" />
          <th className="text-left px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Tarea
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Proyecto
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Estado
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Prioridad
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Vence
          </th>
          <th className="text-left px-4 py-3 pr-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Asignado
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => {
          const key = group.status?.id ?? "__none__";
          const isCollapsed = collapsed.has(key);

          return (
            <>
              {/* Group header */}
              <tr key={`group-${key}`} className="border-y border-gray-100 bg-gray-50/70">
                <td colSpan={7} className="px-0 py-0">
                  <button
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-4 py-2 text-left hover:bg-gray-100/60 transition-colors",
                      group.status?.color === "green"  && "border-l-2 border-green-400",
                      group.status?.color === "amber"  && "border-l-2 border-amber-400",
                      group.status?.color === "blue"   && "border-l-2 border-blue-400",
                      group.status?.color === "red"    && "border-l-2 border-red-400",
                      !group.status?.color || group.status.color === "gray" ? "border-l-2 border-gray-300" : ""
                    )}
                  >
                    <svg
                      className={cn(
                        "w-3 h-3 text-gray-400 shrink-0 transition-transform duration-150",
                        isCollapsed && "-rotate-90"
                      )}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>

                    <span className={cn(
                      "w-2 h-2 rounded-sm shrink-0",
                      group.status?.color === "green"  && "bg-green-400",
                      group.status?.color === "amber"  && "bg-amber-400",
                      group.status?.color === "blue"   && "bg-blue-400",
                      group.status?.color === "red"    && "bg-red-400",
                      (!group.status?.color || group.status.color === "gray") && "bg-gray-300",
                    )} />

                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {group.status?.label ?? "Sin estado"}
                    </span>

                    <span className="text-xs font-medium text-gray-400 bg-gray-200/80 px-1.5 py-0.5 rounded-full leading-none">
                      {group.tasks.length}
                    </span>
                  </button>
                </td>
              </tr>

              {/* Task rows */}
              {!isCollapsed && group.tasks.map((task) => (
                <TaskRowItem
                  key={task.id}
                  task={task}
                  taskStatuses={taskStatuses}
                  onUpdate={updateTask}
                />
              ))}
            </>
          );
        })}
      </tbody>
    </table>
  );
}
