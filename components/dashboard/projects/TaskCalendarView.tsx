"use client";

import { useState, useMemo } from "react";
import type { TaskRow } from "./TasksViewer";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function statusCalendarClass(color: string | null) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-l-2 border-green-400";
    case "amber":
    case "yellow": return "bg-amber-50 text-amber-700 border-l-2 border-amber-400";
    case "blue":   return "bg-blue-50 text-blue-700 border-l-2 border-blue-400";
    case "red":    return "bg-red-50 text-red-700 border-l-2 border-red-400";
    default:       return "bg-gray-50 text-gray-600 border-l-2 border-gray-300";
  }
}

export function TaskCalendarView({ tasks }: { tasks: TaskRow[] }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth    = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const tasksByDay = useMemo(() => {
    const map: Record<number, TaskRow[]> = {};
    for (const task of tasks) {
      if (!task.due_date) continue;
      const [y, m, d] = task.due_date.split("-").map(Number);
      if (y === year && m - 1 === month) {
        if (!map[d]) map[d] = [];
        map[d].push(task);
      }
    }
    return map;
  }, [tasks, year, month]);

  const monthLabel = new Date(year, month).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-700 capitalize">{monthLabel}</span>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {cells.map((day, i) => {
          const dayTasks   = day ? (tasksByDay[day] ?? []) : [];
          const maxVisible = 3;
          const extraCount = dayTasks.length - maxVisible;

          return (
            <div key={i} className={`min-h-[96px] p-1.5 ${!day ? "bg-gray-50/40" : isToday(day) ? "bg-brand-50/30" : "bg-white"}`}>
              {day && (
                <>
                  <div className="mb-1.5 flex justify-end">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? "bg-brand-500 text-white font-semibold" : "text-gray-500"}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, maxVisible).map((task) => (
                      <div key={task.id} className={`text-[11px] truncate rounded px-1.5 py-0.5 leading-tight ${statusCalendarClass(task.status.color)}`} title={task.title}>
                        {task.title}
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="text-[11px] text-gray-400 px-1.5">+{extraCount} más</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {tasks.some((t) => !t.due_date) && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
          <span className="text-xs text-gray-400">
            {tasks.filter((t) => !t.due_date).length} tarea{tasks.filter((t) => !t.due_date).length > 1 ? "s" : ""} sin fecha de vencimiento
          </span>
        </div>
      )}
    </div>
  );
}
