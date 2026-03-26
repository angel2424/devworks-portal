"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PlanMonth = {
  id: string;
  month_number: number;
  year: number;
  month: number;
  status: string;
};

export type PlanRow = {
  id: string;
  type: "spt" | "recurring";
  start_date: string;
  end_date: string | null;
  created_at: string;
  client: { id: string; name: string; company: string | null } | null;
  status: { id: string; label: string; color: string | null; value: string } | null;
  months: PlanMonth[];
};

type Props = {
  plans: PlanRow[];
  statuses: { id: string; label: string; color: string | null; value: string }[];
  clients: { id: string; name: string; company: string | null }[];
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusBadgeClass(color: string | null | undefined) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-green-200";
    case "amber":  return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "red":    return "bg-red-50 text-red-700 border-red-200";
    case "gray":
    default:       return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("es-MX", { month: "short" });
}

function getCurrentMonth(months: PlanMonth[]) {
  const active = months.find((m) => m.status === "active");
  if (!active) return months[months.length - 1] ?? null;
  return active;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PlansTable({ plans, statuses }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isPending) setPendingId(null);
  }, [isPending]);

  function handleRowClick(id: string) {
    setPendingId(id);
    startTransition(() => router.push(`/dashboard/maintenance/${id}`));
  }

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (p.client?.name ?? "").toLowerCase().includes(q) ||
        (p.client?.company ?? "").toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      const matchesStatus = statusFilter === "all" || p.status?.id === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [plans, search, typeFilter, statusFilter]);

  const hasFilters = search !== "" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <Input
            placeholder="Buscar por cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40 text-sm bg-white border-gray-200">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="spt">SPT</SelectItem>
            <SelectItem value="recurring">Recurrente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-44 text-sm bg-white border-gray-200">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
            className="h-9 px-3 text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            Limpiar
          </button>
        )}
      </div>

      <span className="block text-xs text-gray-400 -mt-1">
        {filtered.length} {filtered.length === 1 ? "plan" : "planes"}
      </span>

      {/* Mobile grid */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((plan) => {
              const current = getCurrentMonth(plan.months);
              const isLoading = pendingId === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => !isPending && handleRowClick(plan.id)}
                  disabled={isPending}
                  className={cn(
                    "w-full text-left rounded-xl border bg-white p-4 transition-all active:scale-[0.98] flex flex-col",
                    isLoading
                      ? "border-brand-200 bg-brand-50/60 opacity-75"
                      : "border-gray-200 hover:border-brand-200 hover:bg-brand-50/30 active:bg-brand-50/30 active:border-brand-200"
                  )}
                >
                  {/* Badges row */}
                  <div className="flex items-start justify-between gap-1.5 mb-3">
                    <TypeBadge type={plan.type} />
                    {isLoading
                      ? <Spinner size="xs" className="text-brand-400 shrink-0" />
                      : plan.status && (
                          <Badge
                            variant="outline"
                            className={cn("text-[11px] px-1.5 py-0.5 leading-none shrink-0", statusBadgeClass(plan.status.color))}
                          >
                            {plan.status.label}
                          </Badge>
                        )
                    }
                  </div>

                  {/* Client */}
                  <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                    {plan.client?.name ?? "—"}
                  </p>
                  {plan.client?.company && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{plan.client.company}</p>
                  )}

                  {/* Month + date footer */}
                  <div className="mt-auto pt-3 border-t border-gray-100 space-y-0.5">
                    {current && (
                      <p className="text-[11px] text-gray-500 font-medium">
                        Mes {current.month_number} · {monthName(current.month)} {current.year}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      <span className="text-gray-300">Inicio </span>{formatDate(plan.start_date)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-5">
                Cliente
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tipo
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Estado
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mes actual
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Inicio
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pr-5">
                Fin
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState hasFilters={hasFilters} />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((plan) => {
                const current = getCurrentMonth(plan.months);
                const isLoading = pendingId === plan.id;
                return (
                  <TableRow
                    key={plan.id}
                    className={cn(
                      "cursor-pointer transition-colors group",
                      isLoading ? "bg-brand-50/60 opacity-75" : "hover:bg-brand-50/40"
                    )}
                    onClick={() => !isPending && handleRowClick(plan.id)}
                  >
                    {/* Client */}
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <svg
                            className="w-3.5 h-3.5 text-amber-500"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors block truncate">
                            {plan.client?.name ?? "—"}
                          </span>
                          {plan.client?.company && (
                            <span className="text-xs text-gray-400 block truncate">
                              {plan.client.company}
                            </span>
                          )}
                        </div>
                        {isLoading && <Spinner size="xs" className="text-brand-400 ml-1 shrink-0" />}
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="py-3.5">
                      <TypeBadge type={plan.type} />
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5">
                      {plan.status && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs px-2 py-0.5", statusBadgeClass(plan.status.color))}
                        >
                          {plan.status.label}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Current month */}
                    <TableCell className="py-3.5">
                      {current ? (
                        <span className="text-sm text-gray-700">
                          Mes {current.month_number}
                          <span className="text-xs text-gray-400 ml-1.5">
                            {monthName(current.month)} {current.year}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Start */}
                    <TableCell className="py-3.5">
                      <span className="text-xs text-gray-500">{formatDate(plan.start_date)}</span>
                    </TableCell>

                    {/* End */}
                    <TableCell className="py-3.5 pr-5">
                      <span className="text-xs text-gray-500">{formatDate(plan.end_date)}</span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: "spt" | "recurring" }) {
  return type === "spt" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
      SPT
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      Recurrente
    </span>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">
        {hasFilters ? "Sin resultados para estos filtros" : "No hay planes de mantenimiento"}
      </p>
      <p className="text-xs text-gray-400">
        {hasFilters
          ? "Ajusta los filtros para ver más planes."
          : "Crea el primer plan para un cliente."}
      </p>
      {!hasFilters && (
        <Link
          href="/dashboard/maintenance/new"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo plan
        </Link>
      )}
    </div>
  );
}
