import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Plan = {
  id: string;
  type: "spt" | "recurring";
  status_value: string;
  months: { id: string; month_number: number; year: number; month: number; status: string }[];
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function createNewMonths(year: number, month: number): Promise<string[]> {
  const supabase = createAdminClient();
  const log: string[] = [];

  // Status IDs we need
  const { data: statuses } = await supabase
    .from("catalog_status")
    .select("id, category, value")
    .in("category", ["maintenance", "maintenance_task_status"]);

  if (!statuses) throw new Error("No se pudieron obtener catalog_status");

  const pendingTaskStatusId = statuses.find(
    (s) => s.category === "maintenance_task_status" && s.value === "pending"
  )?.id;
  const activeStatusIds = statuses
    .filter((s) => s.category === "maintenance" && ["active", "pending_deactivation"].includes(s.value))
    .map((s) => s.id);

  if (!pendingTaskStatusId) throw new Error("Estado 'pending' de tareas no encontrado");
  if (!activeStatusIds.length) throw new Error("Estados activos no encontrados");

  // Templates
  const { data: templates } = await supabase
    .from("maintenance_task_templates")
    .select("week_number, title, responsible, estimated_duration, order_index")
    .order("week_number")
    .order("order_index");

  // All active plans with their months
  const { data: rawPlans } = await supabase
    .from("maintenance_plans")
    .select("id, type, months:maintenance_months(id, month_number, year, month, status)")
    .in("status_id", activeStatusIds);

  if (!rawPlans?.length) {
    log.push("No hay planes activos");
    return log;
  }

  for (const raw of rawPlans) {
    const months = (raw.months ?? []) as Plan["months"];

    // Already has a month for this calendar period?
    const alreadyExists = months.some((m) => m.year === year && m.month === month);
    if (alreadyExists) {
      log.push(`Plan ${raw.id}: mes ${month}/${year} ya existe, omitido`);
      continue;
    }

    // SPT hard cap at 5
    const maxMonthNumber = months.reduce((max, m) => Math.max(max, m.month_number), 0);
    if (raw.type === "spt" && maxMonthNumber >= 5) {
      log.push(`Plan ${raw.id} (SPT): ya tiene 5 meses, omitido`);
      continue;
    }

    const { data: newMonth, error: mmError } = await supabase
      .from("maintenance_months")
      .insert({
        plan_id: raw.id,
        month_number: maxMonthNumber + 1,
        year,
        month,
        status: "active",
      })
      .select("id")
      .single();

    if (mmError || !newMonth) {
      log.push(`Plan ${raw.id}: error al crear mes — ${mmError?.message}`);
      continue;
    }

    if (templates?.length) {
      await supabase.from("maintenance_tasks").insert(
        templates.map((t) => ({
          month_id: newMonth.id,
          week_number: t.week_number,
          title: t.title,
          responsible: t.responsible,
          estimated_duration: t.estimated_duration,
          status_id: pendingTaskStatusId,
          order_index: t.order_index,
        }))
      );
    }

    log.push(`Plan ${raw.id}: mes ${month}/${year} creado (mes #${maxMonthNumber + 1})`);
  }

  return log;
}

async function closeCurrentMonths(year: number, month: number): Promise<string[]> {
  const supabase = createAdminClient();
  const log: string[] = [];

  // Get status IDs
  const { data: statuses } = await supabase
    .from("catalog_status")
    .select("id, category, value")
    .in("category", ["maintenance"]);

  const statusMap = Object.fromEntries(
    (statuses ?? []).map((s) => [s.value, s.id])
  ) as Record<string, string>;

  // Find active months for current period
  const { data: activeMonths } = await supabase
    .from("maintenance_months")
    .select("id, plan_id, month_number")
    .eq("year", year)
    .eq("month", month)
    .eq("status", "active");

  if (!activeMonths?.length) {
    log.push(`No hay meses activos para ${month}/${year}`);
    return log;
  }

  // Mark all as completed
  const monthIds = activeMonths.map((m) => m.id);
  await supabase
    .from("maintenance_months")
    .update({ status: "completed" })
    .in("id", monthIds);

  log.push(`${monthIds.length} meses marcados como completados`);

  // Plan lifecycle: check each affected plan
  const planIds = [...new Set(activeMonths.map((m) => m.plan_id))];

  for (const planId of planIds) {
    const closedMonth = activeMonths.find((m) => m.plan_id === planId)!;

    const { data: plan } = await supabase
      .from("maintenance_plans")
      .select("type, status:catalog_status!status_id(value)")
      .eq("id", planId)
      .single();

    if (!plan) continue;

    const statusValue = Array.isArray(plan.status) ? plan.status[0]?.value : (plan.status as { value: string } | null)?.value;

    // SPT: complete after month 5
    if (plan.type === "spt" && closedMonth.month_number === 5) {
      if (statusMap.completed) {
        await supabase
          .from("maintenance_plans")
          .update({ status_id: statusMap.completed })
          .eq("id", planId);
        log.push(`Plan ${planId} (SPT): completado`);
      }
      continue;
    }

    // Recurring: archive if pending_deactivation
    if (statusValue === "pending_deactivation") {
      if (statusMap.archived) {
        await supabase
          .from("maintenance_plans")
          .update({ status_id: statusMap.archived })
          .eq("id", planId);
        log.push(`Plan ${planId}: archivado`);
      }
    }
  }

  return log;
}

// ─── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const lastDay = new Date(year, month, 0).getDate();

  const results: string[] = [];
  const errors: string[] = [];

  // 1st of month: create new months
  if (day === 1) {
    try {
      const log = await createNewMonths(year, month);
      results.push(...log);
    } catch (e) {
      errors.push(`createNewMonths: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Last day of month: complete months + plan lifecycle
  if (day === lastDay) {
    try {
      const log = await closeCurrentMonths(year, month);
      results.push(...log);
    } catch (e) {
      errors.push(`closeCurrentMonths: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (day !== 1 && day !== lastDay) {
    results.push(`Día ${day}: sin acciones programadas`);
  }

  return NextResponse.json({ ok: errors.length === 0, date: now.toISOString(), results, errors });
}
