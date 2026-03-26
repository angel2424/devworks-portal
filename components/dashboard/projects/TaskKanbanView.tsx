"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TaskRow, StatusInfo } from "./TasksViewer";

type Props = {
  tasks: TaskRow[];
  taskStatuses: StatusInfo[];
  onUpdateTask: (taskId: string, dbChanges: Record<string, unknown>, localMerge: Partial<TaskRow>) => void;
};

function statusDotClass(color: string | null) {
  switch (color) {
    case "green":  return "bg-green-500";
    case "amber":
    case "yellow": return "bg-amber-400";
    case "blue":   return "bg-blue-500";
    case "red":    return "bg-red-500";
    default:       return "bg-gray-300";
  }
}

function statusBadgeClass(color: string | null) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-green-200";
    case "amber":
    case "yellow": return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "red":    return "bg-red-50 text-red-700 border-red-200";
    default:       return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDateShort(dateStr: string | null) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function isOverdue(due: string | null) {
  if (!due) return false;
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, m - 1, d) < new Date();
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableCard({ task, isOverlay = false }: { task: TaskRow; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-xl border bg-white p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing touch-none select-none transition-all ${
        isDragging
          ? "opacity-40 shadow-sm"
          : isOverlay
          ? "shadow-xl border-brand-200 rotate-1 scale-[1.02]"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <p className="text-sm text-gray-800 font-medium leading-snug">{task.title}</p>

      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={`text-xs ${statusBadgeClass(task.priority.color)}`}>
          {task.priority.label}
        </Badge>
        {task.phase && (
          <span className="text-xs text-gray-400 truncate max-w-[6rem]">{task.phase.name}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-gray-100">
        {task.assigned ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarFallback className="text-[10px] bg-brand-100 text-brand-700">
                {initials(task.assigned.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 truncate max-w-[7rem]">{task.assigned.full_name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-300">Sin asignar</span>
        )}
        {task.due_date && (
          <span className={`text-xs font-medium shrink-0 ${isOverdue(task.due_date) ? "text-red-500" : "text-gray-400"}`}>
            {formatDateShort(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({
  status,
  tasks,
}: {
  status: StatusInfo;
  tasks: TaskRow[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div className="w-72 shrink-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(status.color)}`} />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{status.label}</span>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 min-h-[120px] rounded-xl p-1.5 transition-colors ${
          isOver ? "bg-brand-50/60 ring-1 ring-brand-200" : "bg-transparent"
        }`}
      >
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-gray-200">
            <span className="text-xs text-gray-300">Arrastra aquí</span>
          </div>
        )}
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

// ─── Mobile status tab selector ───────────────────────────────────────────────

function MobileKanban({
  tasks,
  taskStatuses,
  onUpdateTask,
}: Props) {
  const [activeStatusId, setActiveStatusId] = useState<string>(
    taskStatuses[0]?.id ?? ""
  );

  useEffect(() => {
    if (taskStatuses.length > 0 && !taskStatuses.find((s) => s.id === activeStatusId)) {
      setActiveStatusId(taskStatuses[0].id);
    }
  }, [taskStatuses, activeStatusId]);

  const activeStatus = taskStatuses.find((s) => s.id === activeStatusId);
  const visibleTasks = tasks.filter((t) => t.status.id === activeStatusId);

  return (
    <div className="space-y-3">
      {/* Status tab strip */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {taskStatuses.map((status) => {
          const count = tasks.filter((t) => t.status.id === status.id).length;
          const isActive = status.id === activeStatusId;
          return (
            <button
              key={status.id}
              onClick={() => setActiveStatusId(status.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all active:scale-95",
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 active:bg-gray-200"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDotClass(status.color))} />
              {status.label}
              <span className={cn(
                "text-[10px] font-semibold tabular-nums",
                isActive ? "text-white/70" : "text-gray-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards for selected status — tappable to change status */}
      {visibleTasks.length === 0 ? (
        <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-200">
          <span className="text-xs text-gray-300">
            Sin tareas en {activeStatus?.label ?? "este estado"}
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTasks.map((task) => (
            <MobileKanbanCard
              key={task.id}
              task={task}
              taskStatuses={taskStatuses}
              onUpdateTask={onUpdateTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileKanbanCard({
  task,
  taskStatuses,
  onUpdateTask,
}: {
  task: TaskRow;
  taskStatuses: StatusInfo[];
  onUpdateTask: Props["onUpdateTask"];
}) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2.5 active:bg-gray-50/60 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800 font-medium leading-snug">{task.title}</p>
        {/* Tap badge to change status */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowStatusPicker((v) => !v)}
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-md border transition-opacity active:opacity-70",
              statusBadgeClass(task.status.color)
            )}
          >
            {task.status.label}
          </button>
          {showStatusPicker && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden min-w-[140px]">
              {taskStatuses.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onUpdateTask(task.id, { status_id: s.id }, { status: s });
                    setShowStatusPicker(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 active:bg-gray-100 flex items-center gap-2"
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDotClass(s.color))} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", statusBadgeClass(task.priority.color))}>
            {task.priority.label}
          </Badge>
          {task.assigned && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4 shrink-0">
                <AvatarFallback className="text-[9px] bg-brand-100 text-brand-700">
                  {initials(task.assigned.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500 truncate max-w-24">{task.assigned.full_name}</span>
            </div>
          )}
        </div>
        {task.due_date && (
          <span className={cn("text-xs font-medium shrink-0", isOverdue(task.due_date) ? "text-red-500" : "text-gray-400")}>
            {formatDateShort(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Kanban View ─────────────────────────────────────────────────────────

export function TaskKanbanView({ tasks, taskStatuses, onUpdateTask }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const taskId      = active.id as string;
    const newStatusId = over.id as string;

    const targetStatus = taskStatuses.find((s) => s.id === newStatusId);
    if (!targetStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status.id === newStatusId) return;

    onUpdateTask(taskId, { status_id: newStatusId }, { status: targetStatus });
  }

  function handleDragOver({ over }: DragOverEvent) {
    void over;
  }

  if (taskStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        No hay estados de tarea configurados en catalog_status.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: status tabs + single-column cards */}
      <div className="md:hidden">
        <MobileKanban tasks={tasks} taskStatuses={taskStatuses} onUpdateTask={onUpdateTask} />
      </div>

      {/* Desktop: horizontal scrollable multi-column drag-and-drop */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {taskStatuses.map((status) => (
                <DroppableColumn
                  key={status.id}
                  status={status}
                  tasks={tasks.filter((t) => t.status.id === status.id)}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
            {activeTask && <DraggableCard task={activeTask} isOverlay />}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
