"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPlan(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const type = formData.get("type") as "spt" | "recurring";
  const clientId = formData.get("client_id") as string;
  const projectId = formData.get("project_id") as string;
  const startDate = formData.get("start_date") as string;

  if (!type || !clientId || !startDate) {
    throw new Error("Campos requeridos: tipo, cliente y fecha de inicio");
  }
  if (type === "spt" && !projectId) {
    throw new Error("SPT requiere un proyecto vinculado");
  }

  // Get the 'active' status for maintenance category
  const { data: activeStatus } = await supabase
    .from("catalog_status")
    .select("id")
    .eq("category", "maintenance")
    .eq("value", "active")
    .single();

  if (!activeStatus) {
    throw new Error("Estado 'Activo' no encontrado. Corre el seed de catalog_status.");
  }

  // Get the 'pending' status for maintenance_task_status category
  const { data: pendingTaskStatus } = await supabase
    .from("catalog_status")
    .select("id")
    .eq("category", "maintenance_task_status")
    .eq("value", "pending")
    .single();

  if (!pendingTaskStatus) {
    throw new Error("Estado 'pending' de tareas no encontrado.");
  }

  // Parse date parts directly to avoid UTC offset shifting the day
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);

  // For SPT: end_date = start_date + 5 months
  let endDate: string | null = null;
  if (type === "spt") {
    const d = new Date(startYear, startMonth - 1 + 5, startDay);
    endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const { data: plan, error: planError } = await supabase
    .from("maintenance_plans")
    .insert({
      client_id: clientId,
      project_id: projectId || null,
      type,
      status_id: activeStatus.id,
      start_date: startDate,
      end_date: endDate,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Error al crear el plan");
  }

  // Fetch task templates ordered by week + order_index
  const { data: templates } = await supabase
    .from("maintenance_task_templates")
    .select("week_number, title, responsible, estimated_duration, order_index")
    .order("week_number")
    .order("order_index");

  // Create months: 5 for SPT (all upfront), 1 for recurring (cron adds subsequent months)
  const monthCount = type === "spt" ? 5 : 1;

  for (let i = 0; i < monthCount; i++) {
    // Use local Date to avoid UTC offset shifting the month
    const d = new Date(startYear, startMonth - 1 + i, startDay);

    const { data: mm, error: mmError } = await supabase
      .from("maintenance_months")
      .insert({
        plan_id: plan.id,
        month_number: i + 1,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        status: "active",
      })
      .select("id")
      .single();

    if (mmError || !mm) {
      throw new Error(mmError?.message ?? "Error al crear mes");
    }

    // Seed tasks from template
    if (templates && templates.length > 0) {
      await supabase.from("maintenance_tasks").insert(
        templates.map((t) => ({
          month_id: mm.id,
          week_number: t.week_number,
          title: t.title,
          responsible: t.responsible,
          estimated_duration: t.estimated_duration,
          status_id: pendingTaskStatus.id,
          order_index: t.order_index,
        }))
      );
    }
  }

  revalidatePath("/dashboard/maintenance");
  redirect(`/dashboard/maintenance/${plan.id}`);
}
