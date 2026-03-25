import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// ─── Admin client (bypasses RLS) ──────────────────────────────────────────────

function adminClient() {
  // Supabase new naming: SUPABASE_SECRET_KEY (previously SUPABASE_SERVICE_ROLE_KEY)
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey!,
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type TaskRow = {
  id: string;
  title: string;
  assigned_to: string;
  project: { id: string; name: string } | { id: string; name: string }[] | null;
  status: { value: string } | { value: string }[] | null;
  logs: { task_id: string; user_id: string; type: string }[];
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verify the cron secret set in env (Supabase pg_net passes it as a header)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  webpush.setVapidDetails(
    "mailto:hello@devworks.studio",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const admin = adminClient();
  const now = new Date();

  // Build date strings in local server time (UTC)
  const pad = (n: number) => String(n).padStart(2, "0");
  const toDateStr = (d: Date) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

  const today = toDateStr(now);
  const tomorrow = toDateStr(new Date(now.getTime() + 86_400_000));
  const currentHour = now.getUTCHours();

  let sent = 0;
  const errors: string[] = [];

  // ─── 24h notifications (tasks due tomorrow) ────────────────────────────────
  const tasks24h = await getEligibleTasks(admin, tomorrow, "24h");
  for (const task of tasks24h) {
    const err = await processTask(admin, task, "24h", {
      notifTitle: "Tarea vence mañana",
      notifType: "task_due_24h",
    });
    if (err) errors.push(err);
    else sent++;
  }

  // ─── 1h notifications (tasks due today, sent during the 22:xx hour) ────────
  // "1 hour before end of day" = ~23:00. We fire when cron runs at 22:xx.
  if (currentHour === 22) {
    const tasks1h = await getEligibleTasks(admin, today, "1h");
    for (const task of tasks1h) {
      const err = await processTask(admin, task, "1h", {
        notifTitle: "Tarea vence hoy",
        notifType: "task_due_1h",
      });
      if (err) errors.push(err);
      else sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, errors });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getEligibleTasks(
  admin: ReturnType<typeof adminClient>,
  dueDate: string,
  notifType: string,
): Promise<TaskRow[]> {
  const { data: tasks, error } = await admin
    .from("tasks")
    .select(`
      id, title, assigned_to,
      project:projects(id, name),
      status:catalog_status!status_id(value),
      logs:task_notification_log(task_id, user_id, type)
    `)
    .eq("due_date", dueDate)
    .not("assigned_to", "is", null);

  if (error || !tasks?.length) return [];

  return (tasks as TaskRow[]).filter((task) => {
    // Skip completed tasks
    const status = Array.isArray(task.status) ? task.status[0] : task.status;
    if (status?.value === "done") return false;

    // Skip if notification already sent for this (task, user, type) combo
    const alreadySent = task.logs.some(
      (log) => log.task_id === task.id && log.user_id === task.assigned_to && log.type === notifType,
    );
    return !alreadySent;
  });
}

async function processTask(
  admin: ReturnType<typeof adminClient>,
  task: TaskRow,
  logType: string,
  payload: { notifTitle: string; notifType: string },
): Promise<string | null> {
  const { id, title, assigned_to } = task;
  const project = Array.isArray(task.project) ? task.project[0] : task.project;
  const link = project?.id ? `/dashboard/projects/${project.id}` : "/dashboard";

  try {
    // Insert in-app notification
    await admin.from("notifications").insert({
      user_id: assigned_to,
      type: payload.notifType,
      title: payload.notifTitle,
      body: title,
      link,
    });

    // Log dedup entry (unique constraint prevents duplicates)
    await admin
      .from("task_notification_log")
      .insert({ task_id: id, user_id: assigned_to, type: logType })
      .throwOnError();

    // Send web push to all subscribed devices for this user
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", assigned_to);

    if (subs?.length) {
      const pushPayload = JSON.stringify({
        title: payload.notifTitle,
        body: title,
        url: link,
        icon: "/icons/192.png",
        badge: "/icons/192.png",
      });

      await Promise.all(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload,
            );
          } catch (err: unknown) {
            // 410 Gone / 404 Not Found = subscription expired, clean it up
            const code = (err as { statusCode?: number }).statusCode;
            if (code === 410 || code === 404) {
              await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            }
          }
        }),
      );
    }

    return null;
  } catch (err: unknown) {
    return err instanceof Error ? err.message : String(err);
  }
}
