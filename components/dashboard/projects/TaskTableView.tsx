"use client";

import { useState, useMemo, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Trash2, X } from "lucide-react";
import { DurationInput } from "@/components/ui/duration-input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"; // still used for priority, assigned, phase
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TaskRow, StatusInfo, PhaseInfo, TeamMember } from "./TasksViewer";

// ─── Custom sensor: ignore clicks on interactive elements ─────────────────────

function isInteractiveElement(el: Element | null): boolean {
  const tags = ["button", "input", "textarea", "select", "option", "a", "label"];
  while (el) {
    if (tags.includes(el.tagName.toLowerCase())) return true;
    // Radix Select portals / popovers
    if (el.getAttribute("role") === "option" || el.getAttribute("role") === "listbox") return true;
    el = el.parentElement;
  }
  return false;
}

class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) return false;
        return !isInteractiveElement(nativeEvent.target as Element);
      },
    },
  ];
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  tasks: TaskRow[];
  phases: PhaseInfo[];
  taskStatuses: StatusInfo[];
  priorities: StatusInfo[];
  teamMembers: TeamMember[];
  onUpdateTask: (taskId: string, dbChanges: Record<string, unknown>, localMerge: Partial<TaskRow>) => void;
  onReorderTasks: (phaseId: string | null, orderedIds: string[]) => void;
  onDeleteTask: (taskId: string) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function isOverdue(due: string | null) {
  if (!due) return false;
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, m - 1, d) < new Date();
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Cycle Button ─────────────────────────────────────────────────────────────

function CycleButton({
  color,
  isPending,
  onClick,
}: {
  color: string | null;
  isPending: boolean;
  onClick: () => void;
}) {
  const isDone    = color === "green";
  const isAmber   = color === "amber" || color === "yellow";
  const isRed     = color === "red";
  const isBlue    = color === "blue";
  const isEmpty   = !color || color === "gray";

  const baseClass = "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all focus:outline-none";

  if (isPending) {
    return (
      <button disabled className={`${baseClass} border-gray-200 bg-white cursor-wait`}>
        <svg className="w-2.5 h-2.5 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </button>
    );
  }

  if (isDone) {
    return (
      <button onClick={onClick} title="Cambiar estado" className={`${baseClass} border-green-500 bg-green-500 text-white hover:bg-green-600 hover:border-green-600`}>
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    );
  }

  if (isAmber) {
    return (
      <button onClick={onClick} title="Cambiar estado" className={`${baseClass} border-amber-400 bg-amber-50 hover:bg-amber-100`}>
        <span className="w-2 h-2 rounded-full bg-amber-400" />
      </button>
    );
  }

  if (isRed) {
    return (
      <button onClick={onClick} title="Cambiar estado" className={`${baseClass} border-red-400 bg-red-50 hover:bg-red-100`}>
        <svg className="w-2.5 h-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
        </svg>
      </button>
    );
  }

  if (isBlue) {
    return (
      <button onClick={onClick} title="Cambiar estado" className={`${baseClass} border-blue-400 bg-blue-50 hover:bg-blue-100`}>
        <span className="w-2 h-2 rounded-full bg-blue-400" />
      </button>
    );
  }

  // Default: empty ring (pending / gray)
  return (
    <button onClick={onClick} title="Cambiar estado" className={`${baseClass} border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50`}>
      {!isEmpty && <span className="w-2 h-2 rounded-full bg-gray-300" />}
    </button>
  );
}

// ─── Sortable Task Row ────────────────────────────────────────────────────────

function SortableTaskRow({
  task,
  phases,
  taskStatuses,
  priorities,
  teamMembers,
  onUpdateTask,
  onDeleteTask,
}: {
  task: TaskRow;
  phases: PhaseInfo[];
  taskStatuses: StatusInfo[];
  priorities: StatusInfo[];
  teamMembers: TeamMember[];
  onUpdateTask: Props["onUpdateTask"];
  onDeleteTask: Props["onDeleteTask"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft]     = useState(task.title);
  const [isCycling, startCycle]         = useTransition();

  function cycleStatus() {
    const currentIdx = taskStatuses.findIndex((s) => s.id === task.status.id);
    const next = taskStatuses[(currentIdx + 1) % taskStatuses.length];
    if (!next) return;
    startCycle(() => {
      onUpdateTask(task.id, { status_id: next.id }, { status: next });
    });
  }

  function saveTitle() {
    setTitleEditing(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title) return;
    onUpdateTask(task.id, { title: trimmed }, { title: trimmed });
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`group transition-colors ${isDragging ? "bg-brand-50/30" : "hover:bg-gray-50/60"}`}
    >
      {/* Drag handle */}
      <TableCell className="w-8 pl-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-500 flex items-center transition-colors"
          tabIndex={-1}
          aria-label="Reordenar tarea"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </TableCell>

      {/* Title + cycle button */}
      <TableCell className="py-2.5 pl-2 min-w-[200px]">
        <div className="flex items-center gap-2">
          <CycleButton color={task.status.color} isPending={isCycling} onClick={cycleStatus} />
          {titleEditing ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter")  saveTitle();
                if (e.key === "Escape") { setTitleEditing(false); setTitleDraft(task.title); }
              }}
              className="flex-1 text-sm bg-transparent border-b border-brand-400 focus:outline-none py-0.5 text-gray-900"
            />
          ) : (
            <span
              onClick={() => { setTitleEditing(true); setTitleDraft(task.title); }}
              className={`text-sm font-medium cursor-text block hover:text-brand-600 transition-colors ${
                task.status.color === "green" ? "line-through text-gray-400" : "text-gray-800"
              }`}
              title={task.title}
            >
              {task.title}
            </span>
          )}
        </div>
      </TableCell>

      {/* Status — click badge to jump to any state */}
      <TableCell className="py-2.5">
        <Select
          value={task.status.id}
          onValueChange={(val) => {
            const s = taskStatuses.find((x) => x.id === val);
            if (s) onUpdateTask(task.id, { status_id: val }, { status: s });
          }}
        >
          <SelectTrigger className="h-auto border-0 shadow-none p-0 focus:ring-0 w-auto gap-0 [&>svg]:hidden">
            <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 cursor-pointer hover:opacity-75 transition-opacity ${statusBadgeClass(task.status.color)}`}>
              {task.status.label}
            </Badge>
          </SelectTrigger>
          <SelectContent position="popper">
            {taskStatuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Priority */}
      <TableCell className="py-2.5">
        <Select
          value={task.priority.id}
          onValueChange={(val) => {
            const p = priorities.find((x) => x.id === val);
            if (p) onUpdateTask(task.id, { priority_id: val }, { priority: p });
          }}
        >
          <SelectTrigger className="h-auto border-0 shadow-none p-0 focus:ring-0 w-auto gap-0 [&>svg]:hidden">
            <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 cursor-pointer hover:opacity-75 transition-opacity ${statusBadgeClass(task.priority.color)}`}>
              {task.priority.label}
            </Badge>
          </SelectTrigger>
          <SelectContent position="popper">
            {priorities.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Assigned */}
      <TableCell className="py-2.5">
        <Select
          value={task.assigned?.id ?? "unassigned"}
          onValueChange={(val) => {
            const member = teamMembers.find((m) => m.id === val) ?? null;
            const newAssigned = val === "unassigned" ? null : { id: val, full_name: member?.full_name ?? null };
            onUpdateTask(task.id, { assigned_to: val === "unassigned" ? null : val }, { assigned: newAssigned });
          }}
        >
          <SelectTrigger className="h-auto border-0 shadow-none p-0 focus:ring-0 w-auto gap-0 [&>svg]:hidden">
            {task.assigned ? (
              <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-75 transition-opacity">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[10px] bg-brand-100 text-brand-700">
                    {initials(task.assigned.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600 whitespace-nowrap">{task.assigned.full_name ?? "—"}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-300 cursor-pointer hover:text-gray-400 transition-colors">Sin asignar</span>
            )}
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="unassigned">Sin asignar</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.full_name ?? m.id.slice(0, 8)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Phase (reassign) */}
      <TableCell className="py-2.5">
        <Select
          value={task.phase?.id ?? "none"}
          onValueChange={(val) => {
            const newPhase = val === "none" ? null : phases.find((p) => p.id === val) ?? null;
            onUpdateTask(task.id, { phase_id: val === "none" ? null : val }, { phase: newPhase });
          }}
        >
          <SelectTrigger className="h-auto border-0 shadow-none p-0 focus:ring-0 w-auto gap-0 [&>svg]:hidden">
            <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors whitespace-nowrap">
              {task.phase?.name ?? <span className="text-gray-300">—</span>}
            </span>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="none">Sin fase</SelectItem>
            {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Due date */}
      <TableCell className="py-2.5">
        <input
          type="date"
          value={task.due_date ?? ""}
          onChange={(e) => {
            const val = e.target.value || null;
            onUpdateTask(task.id, { due_date: val }, { due_date: val });
          }}
          className={`text-xs bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer w-[104px] ${
            isOverdue(task.due_date) ? "text-red-500" : task.due_date ? "text-gray-500" : "text-gray-300"
          }`}
        />
      </TableCell>

      {/* Duration */}
      <TableCell className="py-2.5 pr-2">
        <DurationInput
          value={task.estimated_duration}
          onChange={(v) => onUpdateTask(task.id, { estimated_duration: v }, { estimated_duration: v })}
          placeholder="—"
        />
      </TableCell>

      {/* Delete */}
      <TableCell className="py-2.5 pr-3 w-8">
        <button
          onClick={() => onDeleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 flex items-center"
          title="Eliminar tarea"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </TableCell>
    </TableRow>
  );
}

// ─── Phase Table (one complete table per phase) ───────────────────────────────

function PhaseTable({
  phase,
  tasks,
  phases,
  taskStatuses,
  priorities,
  teamMembers,
  onUpdateTask,
  onReorderTasks,
  onDeleteTask,
}: {
  phase: PhaseInfo | null;
  tasks: TaskRow[];
  phases: PhaseInfo[];
  taskStatuses: StatusInfo[];
  priorities: StatusInfo[];
  teamMembers: TeamMember[];
  onUpdateTask: Props["onUpdateTask"];
  onReorderTasks: Props["onReorderTasks"];
  onDeleteTask: Props["onDeleteTask"];
}) {
  const phaseId       = phase?.id ?? null;
  const activeTasks   = tasks.filter((t) => t.status.color !== "green");
  const completedTasks = tasks.filter((t) => t.status.color === "green");
  const done          = completedTasks.length;
  const total         = tasks.length;
  const progress      = total > 0 ? Math.round((done / total) * 100) : 0;
  const [showCompleted, setShowCompleted] = useState(false);

  const sensors = useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,        { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor,     { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const newIndex = activeTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderTasks(phaseId, arrayMove(activeTasks, oldIndex, newIndex).map((t) => t.id));
  }

  return (
    <DndContext id={`phase-dnd-${phase?.id ?? "none"}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* ── Phase header ── */}
      <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-200 flex items-center gap-3">
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>

        <span className="text-sm font-semibold text-gray-700">
          {phase?.name ?? "Sin fase"}
        </span>

        <span className="text-xs text-gray-400">
          {done}/{total} completadas
        </span>

        <div className="flex-1 max-w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-xs font-medium text-gray-400 tabular-nums ml-auto">
          {progress}%
        </span>
      </div>

      {/* ── Table ── */}
      <Table>
        <TableHeader>
          <TableRow className="bg-white hover:bg-white border-b border-gray-100">
            <TableHead className="w-8 pl-3" />
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2">Tarea</TableHead>
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prioridad</TableHead>
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Responsable</TableHead>
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fase</TableHead>
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vence</TableHead>
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider pr-2">Tiempo</TableHead>
            <TableHead className="w-8 pr-3" />
          </TableRow>
        </TableHeader>

        <TableBody>
          <SortableContext items={activeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {activeTasks.map((task) => (
              <SortableTaskRow
                key={task.id}
                task={task}
                phases={phases}
                taskStatuses={taskStatuses}
                priorities={priorities}
                teamMembers={teamMembers}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </SortableContext>

          {/* Completed tasks toggle */}
          {completedTasks.length > 0 && (
            <>
              <TableRow className="hover:bg-transparent border-t border-gray-100">
                <TableCell colSpan={9} className="py-1.5 pl-9">
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors group"
                  >
                    <ChevronRight
                      className={`w-3 h-3 transition-transform duration-150 ${showCompleted ? "rotate-90" : ""}`}
                    />
                    <span>{completedTasks.length} completada{completedTasks.length !== 1 ? "s" : ""}</span>
                  </button>
                </TableCell>
              </TableRow>

              {showCompleted && completedTasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  phases={phases}
                  taskStatuses={taskStatuses}
                  priorities={priorities}
                  teamMembers={teamMembers}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </>
          )}

          {tasks.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="py-4 pl-10">
                <span className="text-xs text-gray-300 italic">Sin tareas en esta fase</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </DndContext>
  );
}

// ─── Mobile Task Card ─────────────────────────────────────────────────────────

function MobileTaskCard({
  task,
  taskStatuses,
  onUpdateTask,
  onDeleteTask,
}: {
  task: TaskRow;
  taskStatuses: StatusInfo[];
  onUpdateTask: Props["onUpdateTask"];
  onDeleteTask: Props["onDeleteTask"];
}) {
  const [isCycling, startCycle] = useTransition();

  function cycleStatus() {
    const currentIdx = taskStatuses.findIndex((s) => s.id === task.status.id);
    const next = taskStatuses[(currentIdx + 1) % taskStatuses.length];
    if (!next) return;
    startCycle(() => {
      onUpdateTask(task.id, { status_id: next.id }, { status: next });
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      {/* Top row: cycle button + status badge (tappable) + delete */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <CycleButton color={task.status.color} isPending={isCycling} onClick={cycleStatus} />
          <Select
            value={task.status.id}
            onValueChange={(val) => {
              const s = taskStatuses.find((x) => x.id === val);
              if (s) onUpdateTask(task.id, { status_id: val }, { status: s });
            }}
          >
            <SelectTrigger className="h-auto border-0 shadow-none p-0 focus:ring-0 w-auto gap-0 [&>svg]:hidden">
              <Badge variant="outline" className={`text-[11px] px-1.5 py-0.5 leading-none cursor-pointer hover:opacity-75 transition-opacity ${statusBadgeClass(task.status.color)}`}>
                {task.status.label}
              </Badge>
            </SelectTrigger>
            <SelectContent position="popper">
              {taskStatuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => onDeleteTask(task.id)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 active:text-red-500 active:bg-red-50 transition-colors shrink-0"
          aria-label="Eliminar tarea"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <p className={`text-sm font-medium leading-snug line-clamp-2 flex-1 ${
        task.status.color === "green" ? "line-through text-gray-400" : "text-gray-800"
      }`}>
        {task.title}
      </p>

      {/* Footer */}
      <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1">
        <Badge variant="outline" className={`text-[11px] px-1.5 py-0.5 leading-none ${statusBadgeClass(task.priority.color)}`}>
          {task.priority.label}
        </Badge>
        {task.due_date ? (
          <span className={`text-[11px] font-medium shrink-0 ${isOverdue(task.due_date) ? "text-red-500" : "text-gray-400"}`}>
            {task.due_date.slice(5)}
          </span>
        ) : task.assigned ? (
          <div className="flex items-center gap-1 min-w-0">
            <Avatar className="h-4 w-4 shrink-0">
              <AvatarFallback className="text-[9px] bg-brand-100 text-brand-700">
                {initials(task.assigned.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-gray-400 truncate">{task.assigned.full_name?.split(" ")[0]}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Table View ──────────────────────────────────────────────────────────

export function TaskTableView({
  tasks,
  phases,
  taskStatuses,
  priorities,
  teamMembers,
  onUpdateTask,
  onReorderTasks,
  onDeleteTask,
}: Props) {
  const groups = useMemo(() => {
    const phaseMap = new Map<string | null, TaskRow[]>();

    for (const phase of phases) phaseMap.set(phase.id, []);
    phaseMap.set(null, []);

    for (const task of tasks) {
      const key = task.phase?.id ?? null;
      if (!phaseMap.has(key)) phaseMap.set(key, []);
      phaseMap.get(key)!.push(task);
    }

    for (const [, arr] of phaseMap) {
      arr.sort((a, b) => a.order_index - b.order_index);
    }

    return Array.from(phaseMap.entries())
      .map(([phaseId, phaseTasks]) => ({
        phaseId,
        phase: phases.find((p) => p.id === phaseId) ?? null,
        tasks: phaseTasks,
      }))
      .filter(({ tasks: t, phase }) => t.length > 0 || phase !== null);
  }, [tasks, phases]);

  // ── Mobile cards ────────────────────────────────────────────────────────────
  const mobileGroups = groups.filter(({ tasks: t }) => t.length > 0);
  const [mobileShowCompleted, setMobileShowCompleted] = useState<Set<string>>(new Set());

  function toggleMobileCompleted(key: string) {
    setMobileShowCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      {/* Mobile */}
      <div className="space-y-6 md:hidden">
        {mobileGroups.map(({ phase, phaseId, tasks: phaseTasks }) => {
          const key = phaseId ?? "none";
          const activeMobile = phaseTasks.filter((t) => t.status.color !== "green");
          const completedMobile = phaseTasks.filter((t) => t.status.color === "green");
          const showC = mobileShowCompleted.has(key);
          return (
            <div key={key}>
              {/* Phase label */}
              <div className="flex items-center gap-2 px-1 mb-2.5">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {phase?.name ?? "Sin fase"}
                </span>
                <span className="text-xs text-gray-400">({phaseTasks.length})</span>
              </div>
              {/* Grid of active task cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {activeMobile.map((task) => (
                  <MobileTaskCard
                    key={task.id}
                    task={task}
                    taskStatuses={taskStatuses}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                  />
                ))}
              </div>
              {/* Completed toggle */}
              {completedMobile.length > 0 && (
                <div className="mt-2.5">
                  <button
                    onClick={() => toggleMobileCompleted(key)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 px-1 py-1"
                  >
                    <ChevronRight className={`w-3 h-3 transition-transform duration-150 ${showC ? "rotate-90" : ""}`} />
                    {completedMobile.length} completada{completedMobile.length !== 1 ? "s" : ""}
                  </button>
                  {showC && (
                    <div className="grid grid-cols-2 gap-2.5 mt-1 opacity-60">
                      {completedMobile.map((task) => (
                        <MobileTaskCard
                          key={task.id}
                          task={task}
                          taskStatuses={taskStatuses}
                          onUpdateTask={onUpdateTask}
                          onDeleteTask={onDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: one card+table per phase */}
      <div className="hidden md:flex flex-col gap-6">
        {groups.map(({ phase, phaseId, tasks: phaseTasks }) => (
          <PhaseTable
            key={phaseId ?? "none"}
            phase={phase}
            tasks={phaseTasks}
            phases={phases}
            taskStatuses={taskStatuses}
            priorities={priorities}
            teamMembers={teamMembers}
            onUpdateTask={onUpdateTask}
            onReorderTasks={onReorderTasks}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </>
  );
}
