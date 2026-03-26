import React from 'react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty';
import { createClient } from '@/lib/supabase/server';


type TodayTask = {
  id: string;
  title: string;
  project: { id: string; name: string } | null;
  status: { label: string; color: string; value: string } | null;
  priority: { label: string; color: string; value: string } | null;
};


const TodaysTasks = async ({userId} : {userId?: string}) => {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const [
        todayTasksResult,
      ] = await Promise.all([


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
          .eq("assigned_to", userId ?? "")
          .eq("due_date", today)
          .order("order_index"),
      ]);

      const todayTasks: TodayTask[] = (todayTasksResult.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        project: Array.isArray(t.project) ? (t.project[0] ?? null) : (t.project ?? null),
        status: Array.isArray(t.status) ? (t.status[0] ?? null) : (t.status ?? null),
        priority: Array.isArray(t.priority) ? (t.priority[0] ?? null) : (t.priority ?? null),
      }));
  return (
        <div className="flex-2 w-full">
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
                        className="w-2 h-2 rounded-full shrink-0"
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
                      <div className="flex items-center gap-2 shrink-0">
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
  )
}

export default TodaysTasks
