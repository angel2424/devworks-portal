"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  type AppNotification,
} from "@/lib/notifications/actions";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface Props {
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "task_due_1h") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell({ userId }: Props) {
  // Activate PWA push subscriptions (no-op in browser view)
  usePushNotifications();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // ─── Load initial notifications ───────────────────────────────────────────
  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  // ─── Realtime — new notifications arrive live ─────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as AppNotification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ─── Close panel on outside click ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  function handleNotificationClick(n: AppNotification) {
    startTransition(async () => {
      if (!n.read_at) {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
          ),
        );
      }
      if (n.link) {
        setOpen(false);
        router.push(n.link);
      }
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllRead();
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? now })),
      );
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notificaciones"
        className={cn(
          "relative w-8 h-8 flex items-center justify-center rounded-md transition-colors",
          open
            ? "bg-brand-50 text-brand-600"
            : "text-gray-500 hover:text-brand-500 hover:bg-brand-50",
        )}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread badge dot */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 border-2 border-white" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "w-[360px] max-[400px]:w-[calc(100vw-1rem)] max-[400px]:right-[-4px]",
            "bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800">Notificaciones</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500 text-white leading-none tabular-nums">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs text-gray-400 hover:text-brand-600 transition-colors disabled:opacity-50"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center mb-2.5">
                  <svg
                    className="w-4.5 h-4.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-500">Sin notificaciones</p>
                <p className="text-xs text-gray-400 mt-0.5">Te avisaremos cuando haya algo nuevo</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => {
                  const isUnread = !n.read_at;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      disabled={isPending}
                      className={cn(
                        "w-full text-left flex items-start gap-3 px-4 py-3 transition-colors",
                        isUnread
                          ? "bg-brand-50/50 hover:bg-brand-50"
                          : "hover:bg-gray-50/80",
                      )}
                    >
                      {/* Unread dot indicator */}
                      <div className="mt-2.5 shrink-0 w-1.5">
                        {isUnread && (
                          <span className="block w-1.5 h-1.5 rounded-full bg-brand-500" />
                        )}
                      </div>

                      {/* Type icon */}
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          n.type === "task_due_1h"
                            ? "bg-red-50 text-red-500"
                            : "bg-amber-50 text-amber-500",
                        )}
                      >
                        <NotifIcon type={n.type} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs leading-snug",
                            isUnread
                              ? "font-semibold text-gray-800"
                              : "font-medium text-gray-500",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
