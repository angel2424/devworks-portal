"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TaskTableView } from "./TaskTableView";
import { TaskKanbanView } from "./TaskKanbanView";
import { TaskCalendarView } from "./TaskCalendarView";

// ─── Types (exported for use in child components and page) ────────────────────

export type StatusInfo = {
  id: string;
  label: string;
  color: string | null;
};

export type PhaseInfo = {
  id: string;
  name: string;
  order_index: number;
};

export type TeamMember = {
  id: string;
  full_name: string | null;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  estimated_duration: string | null;
  order_index: number;
  status: StatusInfo;
  priority: StatusInfo;
  assigned: { id: string; full_name: string | null } | null;
  phase: { id: string; name: string } | null;
};

type Props = {
  tasks: TaskRow[];
  taskStatuses: StatusInfo[];
  priorities: StatusInfo[];
  teamMembers: TeamMember[];
  phases: PhaseInfo[];
};

type ViewMode = "table" | "kanban" | "calendar";

// ─── View Switcher Options ────────────────────────────────────────────────────

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    key: "table",
    label: "Tabla",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
  {
    key: "kanban",
    label: "Kanban",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    key: "calendar",
    label: "Calendario",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function TasksViewer({ tasks: initialTasks, taskStatuses, priorities, teamMembers, phases }: Props) {
  const [view, setView]   = useState<ViewMode>("table");
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const updateTask = useCallback(async (
    taskId: string,
    dbChanges: Record<string, unknown>,
    localMerge: Partial<TaskRow>
  ) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...localMerge } : t));

    const supabase = createClient();
    const { error } = await supabase.from("tasks").update(dbChanges).eq("id", taskId);
    if (error) {
      console.error("Error updating task:", error.message);
      // Rollback: reload original if needed (simplified — just log for now)
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("Error deleting task:", error.message);
    }
  }, []);

  const reorderTasks = useCallback(async (phaseId: string | null, orderedIds: string[]) => {
    // Optimistic: reorder local state and assign new order_index values
    setTasks((prev) => {
      const others = prev.filter((t) => (t.phase?.id ?? null) !== phaseId);
      const reordered = orderedIds
        .map((id, i) => {
          const task = prev.find((t) => t.id === id);
          return task ? { ...task, order_index: i + 1 } : null;
        })
        .filter(Boolean) as TaskRow[];
      return [...others, ...reordered];
    });

    // Batch DB update — one request per task
    const supabase = createClient();
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase.from("tasks").update({ order_index: i + 1 }).eq("id", id)
      )
    );
  }, []);

  // ── Empty state ───────────────────────────────────────────────────────────

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Sin tareas aún</p>
          <p className="text-xs text-gray-400">Las tareas de este proyecto aparecerán aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setView(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === opt.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Views */}
      {view === "table" && (
        <TaskTableView
          tasks={tasks}
          phases={phases}
          taskStatuses={taskStatuses}
          priorities={priorities}
          teamMembers={teamMembers}
          onUpdateTask={updateTask}
          onReorderTasks={reorderTasks}
          onDeleteTask={deleteTask}
        />
      )}

      {view === "kanban" && (
        <TaskKanbanView
          tasks={tasks}
          taskStatuses={taskStatuses}
          onUpdateTask={updateTask}
        />
      )}

      {view === "calendar" && (
        <TaskCalendarView tasks={tasks} />
      )}
    </div>
  );
}
