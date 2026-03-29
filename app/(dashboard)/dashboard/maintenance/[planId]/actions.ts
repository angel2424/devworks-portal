"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Task ──────────────────────────────────────────────────────────────────────

export async function addTask(
  monthId: string,
  weekNumber: number,
  planId: string,
  data: { title: string; responsible: string; estimated_duration: string }
) {
  const supabase = await createClient();

  const { data: pendingStatus } = await supabase
    .from("catalog_status")
    .select("id")
    .eq("category", "maintenance_task_status")
    .eq("value", "pending")
    .single();

  if (!pendingStatus) throw new Error("Estado 'pending' no encontrado");

  // Get current max order_index for this week
  const { data: existing } = await supabase
    .from("maintenance_tasks")
    .select("order_index")
    .eq("month_id", monthId)
    .eq("week_number", weekNumber)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = ((existing?.[0]?.order_index as number | undefined) ?? 0) + 1;

  const { error } = await supabase.from("maintenance_tasks").insert({
    month_id: monthId,
    week_number: weekNumber,
    title: data.title.trim(),
    responsible: data.responsible.trim() || "Angel",
    estimated_duration: data.estimated_duration.trim() || null,
    status_id: pendingStatus.id,
    order_index: nextIndex,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

export async function cycleTaskStatus(
  taskId: string,
  currentStatusValue: string,
  statuses: { id: string; value: string }[],
  planId: string
) {
  const supabase = await createClient();

  // Cycle order: pending → in_progress → done → pending
  const cycle = ["pending", "in_progress", "done"];
  const currentIdx = cycle.indexOf(currentStatusValue);
  const nextValue = cycle[(currentIdx + 1) % cycle.length];

  const nextStatus = statuses.find((s) => s.value === nextValue);
  if (!nextStatus) throw new Error("Estado siguiente no encontrado");

  const isDone = nextValue === "done";

  const { error } = await supabase
    .from("maintenance_tasks")
    .update({
      status_id: nextStatus.id,
      completed_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

export async function setTaskStatus(
  taskId: string,
  statusId: string,
  statusValue: string,
  planId: string
) {
  const supabase = await createClient();

  const isDone = statusValue === "done";

  const { error } = await supabase
    .from("maintenance_tasks")
    .update({
      status_id: statusId,
      completed_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

export async function setTaskSkipped(
  taskId: string,
  statuses: { id: string; value: string }[],
  planId: string
) {
  const supabase = await createClient();

  const skippedStatus = statuses.find((s) => s.value === "skipped");
  if (!skippedStatus) throw new Error("Estado 'omitida' no encontrado");

  const { error } = await supabase
    .from("maintenance_tasks")
    .update({ status_id: skippedStatus.id, completed_at: null })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

export async function saveTaskNotes(taskId: string, notes: string, planId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_tasks")
    .update({ notes: notes.trim() || null })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

export async function toggleTaskInternalOnly(
  taskId: string,
  currentValue: boolean,
  planId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_tasks")
    .update({ internal_only: !currentValue })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function saveMetrics(
  monthId: string,
  planId: string,
  data: {
    total_clicks?: number | null;
    total_impressions?: number | null;
    avg_ctr?: number | null;
    avg_position?: number | null;
    total_sessions?: number | null;
    notes?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("maintenance_metrics").upsert(
    {
      month_id: monthId,
      ...data,
      entered_by: user.id,
      entered_at: new Date().toISOString(),
    },
    { onConflict: "month_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

// ─── Plan lifecycle ────────────────────────────────────────────────────────────

export async function deactivatePlan(planId: string) {
  const supabase = await createClient();

  const { data: pendingStatus } = await supabase
    .from("catalog_status")
    .select("id")
    .eq("category", "maintenance")
    .eq("value", "pending_deactivation")
    .single();

  if (!pendingStatus) throw new Error("Estado 'pending_deactivation' no configurado");

  const { error } = await supabase
    .from("maintenance_plans")
    .update({
      status_id: pendingStatus.id,
      deactivated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
  revalidatePath("/dashboard/maintenance");
}

export async function getReportSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("maintenance-reports")
    .createSignedUrl(storagePath, 3600); // 1-hour URL

  if (error || !data) throw new Error(error?.message ?? "Error generando URL");
  return data.signedUrl;
}
