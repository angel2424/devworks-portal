"use client";

import { useState, useMemo } from "react";
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
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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

      {/* Title */}
      <TableCell className="py-2.5 pl-2 min-w-[200px]">
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
            className="w-full text-sm bg-transparent border-b border-brand-400 focus:outline-none py-0.5 text-gray-900"
          />
        ) : (
          <span
            onClick={() => { setTitleEditing(true); setTitleDraft(task.title); }}
            className="text-sm text-gray-800 font-medium cursor-text block hover:text-brand-600 transition-colors"
            title={task.title}
          >
            {task.title}
          </span>
        )}
      </TableCell>

      {/* Status */}
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
      <TableCell className="py-2.5 pr-2">
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
  const phaseId  = phase?.id ?? null;
  const taskIds  = tasks.map((t) => t.id);
  const done     = tasks.filter((t) => t.status.color === "green").length;
  const total    = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const sensors = useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,        { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor,     { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderTasks(phaseId, arrayMove(tasks, oldIndex, newIndex).map((t) => t.id));
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
            <TableHead className="text-xs font-semibold text-gray-400 uppercase tracking-wider pr-2">Vence</TableHead>
            <TableHead className="w-8 pr-3" />
          </TableRow>
        </TableHeader>

        <TableBody>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
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

          {tasks.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="py-4 pl-10">
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

  return (
    <>
      {/* Mobile */}
      <div className="space-y-6 md:hidden">
        {mobileGroups.map(({ phase, phaseId, tasks: phaseTasks }) => (
          <div key={phaseId ?? "none"} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {phase?.name ?? "Sin fase"}
              </span>
              <span className="text-xs text-gray-400">({phaseTasks.length})</span>
            </div>
            {phaseTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{task.title}</p>
                  <Badge variant="outline" className={`text-xs shrink-0 ${statusBadgeClass(task.status.color)}`}>
                    {task.status.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${statusBadgeClass(task.priority.color)}`}>
                    {task.priority.label}
                  </Badge>
                  {task.assigned && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[9px] bg-brand-100 text-brand-700">
                          {initials(task.assigned.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">{task.assigned.full_name}</span>
                    </div>
                  )}
                  {task.due_date && (
                    <span className={`text-xs ml-auto ${isOverdue(task.due_date) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      {task.due_date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
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
