"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  project: { id: string; name: string } | null;
  status: { id: string; label: string; color: string; value: string } | null;
  priority: { id: string; label: string; color: string; value: string } | null;
  assignee: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export type StatusGroup = {
  status: TaskRow["status"];
  tasks: TaskRow[];
};

function formatDueDate(dateStr: string | null): {
  label: string;
  state: "expired" | "today" | "soon" | "normal" | "none";
} {
  if (!dateStr) return { label: "Sin fecha", state: "none" };
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const label = date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (diffDays < 0) return { label, state: "expired" };
  if (diffDays === 0) return { label: "Hoy", state: "today" };
  if (diffDays <= 3) return { label, state: "soon" };
  return { label, state: "normal" };
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function TaskGroups({ groups }: { groups: StatusGroup[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="text-left px-4 py-3 font-medium text-gray-500 w-[38%]">
            Tarea
          </th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 w-[20%]">
            Proyecto
          </th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 w-[14%]">
            Prioridad
          </th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 w-[15%]">
            Vencimiento
          </th>
          <th className="text-left px-4 py-3 font-medium text-gray-500 w-[13%]">
            Asignado
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => {
          const key = group.status?.id ?? "__none__";
          const isCollapsed = collapsed.has(key);
          const dotColor = group.status?.color?.startsWith("#")
            ? group.status.color
            : "#9ca3af";

          return (
            <>
              {/* Group header row */}
              <tr key={`group-${key}`} className="border-y border-gray-100 bg-gray-50/70">
                <td colSpan={5} className="px-0 py-0">
                  <button
                    onClick={() => toggle(key)}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-left hover:bg-gray-100/60 transition-colors"
                    style={{ borderLeft: `3px solid ${dotColor}` }}
                  >
                    {/* Chevron */}
                    <svg
                      className={cn(
                        "w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-150",
                        isCollapsed && "-rotate-90"
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>

                    {/* Status dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />

                    {/* Label */}
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {group.status?.label ?? "Sin estado"}
                    </span>

                    {/* Count */}
                    <span className="text-xs font-medium text-gray-400 bg-gray-200/80 px-1.5 py-0.5 rounded-full leading-none">
                      {group.tasks.length}
                    </span>
                  </button>
                </td>
              </tr>

              {/* Task rows */}
              {!isCollapsed &&
                group.tasks.map((task) => {
                  const due = formatDueDate(task.due_date);
                  const priorityColor = task.priority?.color?.startsWith("#")
                    ? task.priority.color
                    : "#6b7280";
                  const initials = getInitials(task.assignee?.full_name);

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Title */}
                      <td className="px-4 py-3 pl-[3.25rem]">
                        <span className="font-medium text-gray-900 line-clamp-1">
                          {task.title}
                        </span>
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3">
                        {task.project ? (
                          <Link
                            href={`/dashboard/projects/${task.project.id}`}
                            className="text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 truncate block max-w-[170px]"
                          >
                            {task.project.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        {task.priority ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${priorityColor}18`,
                              color: priorityColor,
                            }}
                          >
                            {task.priority.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            due.state === "expired" && "text-red-600",
                            due.state === "today" && "text-amber-600",
                            due.state === "soon" && "text-amber-500",
                            due.state === "normal" && "text-gray-600",
                            due.state === "none" && "text-gray-400"
                          )}
                        >
                          {due.label}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            {task.assignee.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={task.assignee.avatar_url}
                                alt={task.assignee.full_name ?? ""}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                                {initials}
                              </span>
                            )}
                            <span className="text-gray-600 truncate hidden xl:block max-w-[80px]">
                              {task.assignee.full_name?.split(" ")[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </>
          );
        })}
      </tbody>
    </table>
  );
}
