"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { NewProjectModal, type ClientOption } from "@/components/dashboard/projects/NewProjectModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusBase = {
  id: string;
  label: string;
  color: string | null;
};

export type StatusOption = StatusBase & { is_default: boolean };

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  status: StatusBase;
  client: { id: string; name: string; company: string | null } | null;
};

type Props = {
  projects: ProjectRow[];
  statuses: StatusOption[];
  clients: ClientOption[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeClass(color: string | null) {
  switch (color) {
    case "green":
      return "bg-green-50 text-green-700 border-green-200";
    case "amber":
    case "yellow":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "red":
      return "bg-red-50 text-red-700 border-red-200";
    case "purple":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "gray":
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectsTable({ projects, statuses, clients }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!isPending) setPendingId(null);
  }, [isPending]);

  function handleRowClick(id: string) {
    setPendingId(id);
    startTransition(() => {
      router.push(`/dashboard/projects/${id}`);
    });
  }

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.client?.name ?? "").toLowerCase().includes(q) ||
        (p.client?.company ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || p.status.id === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const hasFilters = search !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
            />
          </svg>
          <Input
            placeholder="Buscar proyectos o clientes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-44 text-sm bg-white border-gray-200">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="h-9 text-sm text-gray-500 hover:text-gray-700 shrink-0"
          >
            Limpiar
          </Button>
        )}

        <div className="sm:ml-auto shrink-0">
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-9 bg-brand-500 hover:bg-brand-600 text-white"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo proyecto
          </Button>
        </div>
      </div>

      <span className="block text-xs text-gray-400 -mt-2">
        {filtered.length} {filtered.length === 1 ? "proyecto" : "proyectos"}
      </span>

      {/* ── Mobile grid ── */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((project) => {
              const isLoading = pendingId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => !isPending && handleRowClick(project.id)}
                  disabled={isPending}
                  className={`w-full text-left rounded-xl border bg-white p-4 transition-all cursor-pointer active:scale-[0.98] flex flex-col ${
                    isLoading
                      ? "border-brand-200 bg-brand-50/60 opacity-75"
                      : "border-gray-200 hover:border-brand-200 hover:bg-brand-50/30 active:bg-brand-50/30 active:border-brand-200"
                  }`}
                >
                  {/* Icon + status row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                    {isLoading
                      ? <Spinner size="xs" className="text-brand-400" />
                      : <Badge variant="outline" className={`text-[11px] font-medium px-1.5 py-0.5 leading-none ${statusBadgeClass(project.status.color)}`}>
                          {project.status.label}
                        </Badge>
                    }
                  </div>

                  {/* Name + client */}
                  <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{project.name}</p>
                  {project.client && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{project.client.name}</p>
                  )}

                  {/* Dates footer */}
                  <div className="mt-auto pt-3 border-t border-gray-100 space-y-0.5">
                    <p className="text-[11px] text-gray-400">
                      <span className="text-gray-300">Inicio </span>{formatDate(project.start_date)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      <span className="text-gray-300">Entrega </span>{formatDate(project.end_date)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New project modal ── */}
      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clients={clients}
        statuses={statuses}
      />

      {/* ── Desktop table ── */}
      <div className="hidden md:block">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-5">
                  Proyecto
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cliente
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Inicio
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pr-5">
                  Entrega
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState hasFilters={hasFilters} />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((project) => {
                  const isLoading = pendingId === project.id;
                  return (
                    <TableRow
                      key={project.id}
                      className={`cursor-pointer transition-colors group ${
                        isLoading
                          ? "bg-brand-50/60 opacity-75"
                          : "hover:bg-brand-50/40"
                      }`}
                      onClick={() => !isPending && handleRowClick(project.id)}
                    >
                      {/* Name */}
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                            <svg
                              className="w-3.5 h-3.5 text-brand-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors block truncate">
                              {project.name}
                            </span>
                            {project.description && (
                              <span className="text-xs text-gray-400 block truncate max-w-xs">
                                {project.description}
                              </span>
                            )}
                          </div>
                          {isLoading && (
                            <Spinner size="xs" className="text-brand-400 ml-1 shrink-0" />
                          )}
                        </div>
                      </TableCell>

                      {/* Client */}
                      <TableCell className="py-3.5">
                        {project.client ? (
                          <div>
                            <span className="text-sm text-gray-700">{project.client.name}</span>
                            {project.client.company && (
                              <span className="block text-xs text-gray-400">
                                {project.client.company}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium px-2 py-0.5 ${statusBadgeClass(project.status.color)}`}
                        >
                          {project.status.label}
                        </Badge>
                      </TableCell>

                      {/* Start date */}
                      <TableCell className="py-3.5">
                        <span className="text-xs text-gray-500">
                          {formatDate(project.start_date)}
                        </span>
                      </TableCell>

                      {/* End date */}
                      <TableCell className="py-3.5 pr-5">
                        <span className="text-xs text-gray-500">
                          {formatDate(project.end_date)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">
        {hasFilters ? "Sin resultados para estos filtros" : "Aún no hay proyectos"}
      </p>
      <p className="text-xs text-gray-400">
        {hasFilters
          ? "Intenta ajustar los filtros de búsqueda."
          : "Crea tu primer proyecto para empezar."}
      </p>
    </div>
  );
}
