"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusOption = {
  id: string;
  label: string;
  color: string | null;
};

export type TeamMember = {
  id: string;
  full_name: string | null;
};

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
  status: StatusOption;
  assigned: TeamMember | null;
};

type Props = {
  clients: ClientRow[];
  statuses: StatusOption[];
  teamMembers: TeamMember[];
};

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClientsTable({ clients, statuses, teamMembers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");

  useEffect(() => {
    if (!isPending) setPendingId(null);
  }, [isPending]);

  function handleRowClick(id: string) {
    setPendingId(id);
    startTransition(() => {
      router.push(`/dashboard/clients/${id}`);
    });
  }

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || c.status.id === statusFilter;

      const matchesAssigned =
        assignedFilter === "all" ||
        (assignedFilter === "unassigned"
          ? c.assigned === null
          : c.assigned?.id === assignedFilter);

      return matchesSearch && matchesStatus && matchesAssigned;
    });
  }, [clients, search, statusFilter, assignedFilter]);

  const hasFilters =
    search !== "" || statusFilter !== "all" || assignedFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setAssignedFilter("all");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row items-center gap-5">
        <div className="relative flex-1 min-w-48 w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/3 w-3.5 h-3.5 text-gray-400 pointer-events-none"
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
            placeholder="Buscar por nombre, email o empresa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400"
          />
        </div>

    <div className="flex items-center gap-4 w-full">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 flex-1 text-sm bg-white border-gray-200">
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

        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="h-9 flex-1 text-sm bg-white border-gray-200">
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier responsable</SelectItem>
            <SelectItem value="unassigned">Sin asignar</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name ?? m.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
    </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar filtros
          </Button>
        )}

        <div className="ml-auto flex flex-col lg:flex-row gap-6">

          <Button asChild size="lg" className=" bg-brand-500 hover:bg-brand-600 text-white">
            <Link href="/dashboard/clients/new">
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo cliente
            </Link>
          </Button>
        </div>
      </div>

      <div className="md:hidden space-y-6">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {hasFilters ? "Sin resultados para estos filtros" : "Aún no hay clientes"}
            </p>
            <p className="text-xs text-gray-400">
              {hasFilters ? "Intenta ajustar los filtros de búsqueda." : "Agrega tu primer cliente para empezar."}
            </p>
          </div>
        ) : (
          filtered.map((client) => {
            const isLoading = pendingId === client.id;
            return (
              <button
                key={client.id}
                onClick={() => !isPending && handleRowClick(client.id)}
                disabled={isPending}
                className={`w-full text-left rounded-lg border bg-white p-4 transition-all cursor-pointer active:scale-[0.99] ${
                  isLoading
                    ? "border-brand-200 bg-brand-50/60 opacity-75"
                    : "border-gray-200 hover:border-brand-200 hover:bg-brand-50/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs font-medium bg-gray-100 text-gray-600">
                        {initials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      {client.company && (
                        <p className="text-xs text-gray-500 truncate">{client.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isLoading && <Spinner size="xs" className="text-brand-400" />}
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium px-2 py-0.5 ${statusBadgeClass(client.status.color)}`}
                    >
                      {client.status.label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                  {client.assigned && (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4 shrink-0">
                        <AvatarFallback className="text-[9px] bg-brand-100 text-brand-700">
                          {initials(client.assigned.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{client.assigned.full_name}</span>
                    </div>
                  )}
                  <span className="ml-auto text-gray-300">{formatDate(client.created_at)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    <span className="text-sm text-gray-400 px-2">
        {filtered.length}{" "}
        {filtered.length === 1 ? "contacto" : "contactos"}
        </span>

      <div className="hidden md:block">
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-5">
                Nombre
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Empresa
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Estado
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Responsable
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider pr-5">
                Registrado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
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
                          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {hasFilters
                        ? "Sin resultados para estos filtros"
                        : "Aún no hay clientes"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {hasFilters
                        ? "Intenta ajustar los filtros de búsqueda."
                        : "Agrega tu primer cliente para empezar."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client) => {
                const isLoading = pendingId === client.id;
                return (
                <TableRow
                  key={client.id}
                  className={`cursor-pointer transition-colors group ${
                    isLoading
                      ? "bg-brand-50/60 opacity-75"
                      : "hover:bg-brand-50/40"
                  }`}
                  onClick={() => !isPending && handleRowClick(client.id)}
                >
                  {/* Name */}
                  <TableCell className="pl-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[11px] font-medium bg-gray-100 text-gray-600">
                          {initials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
                        {client.name}
                      </span>
                      {isLoading && (
                        <Spinner size="xs" className="text-brand-400 ml-1" />
                      )}
                    </div>
                  </TableCell>

                  {/* Company */}
                  <TableCell className="py-3.5">
                    <span className="text-sm text-gray-600">
                      {client.company ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium px-2 py-0.5 ${statusBadgeClass(
                        client.status.color
                      )}`}
                    >
                      {client.status.label}
                    </Badge>
                  </TableCell>

                  {/* Assigned */}
                  <TableCell className="py-3.5">
                    {client.assigned ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarFallback className="text-[10px] bg-brand-100 text-brand-700">
                            {initials(client.assigned.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">
                          {client.assigned.full_name ?? "—"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-300">Sin asignar</span>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="py-3.5 pr-5">
                    <span className="text-xs text-gray-400">
                      {formatDate(client.created_at)}
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
