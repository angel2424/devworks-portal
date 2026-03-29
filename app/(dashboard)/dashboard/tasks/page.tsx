export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { TaskFilters } from "@/components/dashboard/tasks/TaskFilters";
import { TaskGroups, type TaskRow } from "@/components/dashboard/tasks/TaskGroups";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const meMode = params.me === "true";
  const expiredOnly = params.expired === "true";
  const statusValues = String(params.status ?? "").split(",").filter(Boolean);
  const priorityValues = String(params.priority ?? "").split(",").filter(Boolean);
  const searchQuery = String(params.q ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const [
    { data: taskStatuses },
    { data: priorities },
    { data: doneStatuses },
  ] = await Promise.all([
    supabase
      .from("catalog_status")
      .select("id, label, value, color")
      .eq("category", "task_status")
      .order("order_index"),
    supabase
      .from("catalog_status")
      .select("id, label, value, color")
      .eq("category", "priority")
      .order("order_index"),
    supabase
      .from("catalog_status")
      .select("id")
      .eq("category", "task_status")
      .eq("value", "done"),
  ]);

  const doneIds = (doneStatuses ?? []).map((s: { id: string }) => s.id);

  let statusFilterIds: string[] = [];
  if (statusValues.length && taskStatuses) {
    statusFilterIds = taskStatuses
      .filter((s) => statusValues.includes(s.value))
      .map((s) => s.id);
  }

  let priorityFilterIds: string[] = [];
  if (priorityValues.length && priorities) {
    priorityFilterIds = priorities
      .filter((p) => priorityValues.includes(p.value))
      .map((p) => p.id);
  }

  let query = supabase.from("tasks").select(`
    id, title, due_date,
    project:projects(id, name),
    status:catalog_status!status_id(id, label, color, value),
    priority:catalog_status!priority_id(id, label, color, value),
    assignee:profiles!assigned_to(id, full_name, avatar_url)
  `);

  if (meMode) query = query.eq("assigned_to", user?.id ?? "");

  if (expiredOnly) {
    query = query.lt("due_date", today);
    if (!statusFilterIds.length && doneIds.length) {
      query = query.not("status_id", "in", `(${doneIds.join(",")})`);
    }
  }

  if (statusFilterIds.length) query = query.in("status_id", statusFilterIds);
  if (priorityFilterIds.length) query = query.in("priority_id", priorityFilterIds);
  if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);

  query = query.order("due_date", { ascending: true, nullsFirst: false });

  const { data: tasks } = await query;
  const typedTasks: TaskRow[] = (tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    project: Array.isArray(t.project) ? (t.project[0] ?? null) : (t.project ?? null),
    status: Array.isArray(t.status) ? (t.status[0] ?? null) : (t.status ?? null),
    priority: Array.isArray(t.priority) ? (t.priority[0] ?? null) : (t.priority ?? null),
    assignee: Array.isArray(t.assignee) ? (t.assignee[0] ?? null) : (t.assignee ?? null),
  }));

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl text-gray-900">Tareas</h1>
          {typedTasks.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {typedTasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TaskFilters
          statuses={taskStatuses ?? []}
          priorities={priorities ?? []}
        />
      </div>

      {/* Grouped table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {typedTasks.length === 0 ? (
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
              <EmptyTitle>Sin tareas</EmptyTitle>
              <EmptyDescription>
                No hay tareas que coincidan con los filtros aplicados.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <TaskGroups tasks={typedTasks} taskStatuses={taskStatuses ?? []} />
        )}
      </div>
    </div>
  );
}
