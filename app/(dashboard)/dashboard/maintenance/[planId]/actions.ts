"use server";

import crypto from "node:crypto";
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
  const now = new Date();
  const completedWeek = isDone
    ? (now.getDate() <= 7 ? 1 : now.getDate() <= 14 ? 2 : now.getDate() <= 21 ? 3 : 4)
    : undefined;

  const { error } = await supabase
    .from("maintenance_tasks")
    .update({
      status_id: nextStatus.id,
      completed_at: isDone ? now.toISOString() : null,
      ...(completedWeek !== undefined && { week_number: completedWeek }),
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
  const now = new Date();
  const completedWeek = isDone
    ? (now.getDate() <= 7 ? 1 : now.getDate() <= 14 ? 2 : now.getDate() <= 21 ? 3 : 4)
    : undefined;

  const { error } = await supabase
    .from("maintenance_tasks")
    .update({
      status_id: statusId,
      completed_at: isDone ? now.toISOString() : null,
      ...(completedWeek !== undefined && { week_number: completedWeek }),
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

export async function setTaskCompletedDate(
  taskId: string,
  completedAt: string | null, // "YYYY-MM-DD" or null
  planId: string
) {
  const supabase = await createClient();

  let weekNumber: number | undefined;

  if (completedAt) {
    const day = new Date(completedAt + "T12:00:00").getDate();
    weekNumber = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;
  }

  const updateData: Record<string, unknown> = {
    completed_at: completedAt ? new Date(completedAt + "T12:00:00").toISOString() : null,
  };
  if (weekNumber !== undefined) updateData.week_number = weekNumber;

  const { error } = await supabase
    .from("maintenance_tasks")
    .update(updateData)
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

export async function updateTaskDuration(taskId: string, duration: string | null, planId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_tasks")
    .update({ estimated_duration: duration })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/maintenance/${planId}`);
}

export async function updateTaskWeek(taskId: string, weekNumber: number, planId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_tasks")
    .update({ week_number: weekNumber })
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

// ─── PageSpeed ────────────────────────────────────────────────────────────────

export type PageSpeedMetric = {
  displayValue: string;
  score: number; // 0–1
};

export type PageSpeedResult = {
  score: number; // 0–100
  metrics: {
    fcp: PageSpeedMetric;
    lcp: PageSpeedMetric;
    tbt: PageSpeedMetric;
    cls: PageSpeedMetric;
    si:  PageSpeedMetric;
  };
  fetchedAt: string;
};

export async function analyzePageSpeed(
  monthId: string,
  planId: string,
  url: string,
): Promise<{ mobile: PageSpeedResult; desktop: PageSpeedResult }> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) throw new Error("PAGESPEED_API_KEY no está configurado en el servidor.");

  async function fetchStrategy(strategy: "mobile" | "desktop"): Promise<PageSpeedResult> {
    const endpoint =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
      `?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&key=${apiKey}`;

    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PageSpeed API error (${strategy}): ${res.status} — ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const audits = data.lighthouseResult.audits as Record<string, { displayValue?: string; score?: number }>;
    const perfScore: number = data.lighthouseResult.categories.performance.score;

    function metric(key: string): PageSpeedMetric {
      return {
        displayValue: audits[key]?.displayValue ?? "—",
        score:        audits[key]?.score        ?? 0,
      };
    }

    return {
      score: Math.round(perfScore * 100),
      metrics: {
        fcp: metric("first-contentful-paint"),
        lcp: metric("largest-contentful-paint"),
        tbt: metric("total-blocking-time"),
        cls: metric("cumulative-layout-shift"),
        si:  metric("speed-index"),
      },
      fetchedAt: new Date().toISOString(),
    };
  }

  const [mobile, desktop] = await Promise.all([
    fetchStrategy("mobile"),
    fetchStrategy("desktop"),
  ]);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: existing } = await supabase
    .from("maintenance_metrics")
    .select("id")
    .eq("month_id", monthId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("maintenance_metrics")
      .update({ pagespeed_url: url, pagespeed_mobile: mobile, pagespeed_desktop: desktop })
      .eq("month_id", monthId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("maintenance_metrics")
      .insert({ month_id: monthId, pagespeed_url: url, pagespeed_mobile: mobile, pagespeed_desktop: desktop, entered_by: user.id });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/dashboard/maintenance/${planId}`);
  return { mobile, desktop };
}

// ─── Google Search Console ────────────────────────────────────────────────────

export type GSCRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;      // 0–1
  position: number; // avg position
};

async function getGoogleToken(): Promise<string> {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no está configurado en el servidor.");

  const creds = JSON.parse(credJson) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);

  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss:   creds.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud:   "https://oauth2.googleapis.com/token",
    exp:   now + 3600,
    iat:   now,
  })).toString("base64url");

  const input      = `${header}.${payload}`;
  const privateKey = crypto.createPrivateKey(creds.private_key);
  const sig        = crypto.sign("sha256", Buffer.from(input), privateKey).toString("base64url");
  const jwt        = `${input}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    cache:   "no-store",
  });

  if (!res.ok) throw new Error(`Token error: ${(await res.text()).slice(0, 300)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export async function fetchSearchConsoleData(
  monthId: string,
  planId: string,
  siteUrl: string,
  month: number,
  year: number,
): Promise<{ queries: GSCRow[]; pages: GSCRow[]; countries: GSCRow[] }> {
  const token = await getGoogleToken();

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay   = new Date(year, month, 0).getDate();
  const endDate   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  async function queryDimension(dimension: string): Promise<GSCRow[]> {
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const res = await fetch(endpoint, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ startDate, endDate, dimensions: [dimension], rowLimit: 10 }),
      cache:   "no-store",
    });
    if (!res.ok) throw new Error(`GSC error (${dimension}): ${res.status} — ${(await res.text()).slice(0, 300)}`);
    type RawRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
    const data = await res.json() as { rows?: RawRow[] };
    return (data.rows ?? []).map((r) => ({
      key: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
    }));
  }

  const [queries, pages, countries] = await Promise.all([
    queryDimension("query"),
    queryDimension("page"),
    queryDimension("country"),
  ]);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("maintenance_metrics")
    .select("id")
    .eq("month_id", monthId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("maintenance_metrics")
      .update({ gsc_site_url: siteUrl, gsc_top_queries: queries, gsc_top_pages: pages, gsc_top_countries: countries, gsc_fetched_at: now })
      .eq("month_id", monthId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("maintenance_metrics")
      .insert({ month_id: monthId, gsc_site_url: siteUrl, gsc_top_queries: queries, gsc_top_pages: pages, gsc_top_countries: countries, gsc_fetched_at: now, entered_by: user.id });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/dashboard/maintenance/${planId}`);
  return { queries, pages, countries };
}

// ─── Month lifecycle ───────────────────────────────────────────────────────────

export async function createCurrentMonthIfMissing(planId: string) {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Check if this calendar month already exists for this plan
  const { data: existing } = await supabase
    .from("maintenance_months")
    .select("id")
    .eq("plan_id", planId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (existing) return { created: false, reason: "already_exists" };

  // Validate plan (type + current month count)
  const { data: plan } = await supabase
    .from("maintenance_plans")
    .select("type, months:maintenance_months(month_number)")
    .eq("id", planId)
    .single();

  if (!plan) throw new Error("Plan no encontrado");

  const months = (plan.months as { month_number: number }[]) ?? [];
  const maxMonthNumber = months.reduce((max, m) => Math.max(max, m.month_number), 0);

  if (plan.type === "spt" && maxMonthNumber >= 5) {
    throw new Error("Este plan SPT ya alcanzó sus 5 meses");
  }

  const { data: pendingStatus } = await supabase
    .from("catalog_status")
    .select("id")
    .eq("category", "maintenance_task_status")
    .eq("value", "pending")
    .single();

  if (!pendingStatus) throw new Error("Estado 'pending' de tareas no encontrado");

  const { data: newMonth, error: mmError } = await supabase
    .from("maintenance_months")
    .insert({
      plan_id: planId,
      month_number: maxMonthNumber + 1,
      year,
      month,
      status: "active",
    })
    .select("id")
    .single();

  if (mmError || !newMonth) throw new Error(mmError?.message ?? "Error al crear mes");

  const { data: templates } = await supabase
    .from("maintenance_task_templates")
    .select("week_number, title, responsible, estimated_duration, order_index")
    .order("week_number")
    .order("order_index");

  if (templates?.length) {
    await supabase.from("maintenance_tasks").insert(
      templates.map((t) => ({
        month_id: newMonth.id,
        week_number: t.week_number,
        title: t.title,
        responsible: t.responsible,
        estimated_duration: t.estimated_duration,
        status_id: pendingStatus.id,
        order_index: t.order_index,
      }))
    );
  }

  revalidatePath(`/dashboard/maintenance/${planId}`);
  return { created: true };
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
