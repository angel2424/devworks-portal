export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliverableRow = {
  setId: string;
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  statusLabel: string | null;
  statusColor: string | null;
  total: number;
  draft: number;
  published: number;  // waiting for client
  submitted: number;  // waiting for team review
  approved: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DeliverablesPage() {
  const supabase = await createClient();

  // All sets with their client info
  const { data: rawSets } = await supabase
    .from("deliverable_sets")
    .select(`
      id,
      client:clients!client_id(
        id, name, company,
        status:catalog_status!status_id(label, color)
      )
    `);

  // All non-archived deliverables (just enough to compute stats)
  const { data: rawDeliverables } = await supabase
    .from("deliverables")
    .select("id, set_id, status")
    .neq("status", "archived");

  // Build a map: set_id → deliverables[]
  const bySet = new Map<string, { status: string }[]>();
  for (const d of rawDeliverables ?? []) {
    const list = bySet.get(d.set_id) ?? [];
    list.push({ status: d.status });
    bySet.set(d.set_id, list);
  }

  // Compute rows
  const rows: DeliverableRow[] = (rawSets ?? []).map((s) => {
    const client = Array.isArray(s.client) ? s.client[0] : s.client;
    const statusInfo = Array.isArray(client?.status)
      ? client.status[0]
      : client?.status;
    const deliverables = bySet.get(s.id) ?? [];

    return {
      setId: s.id,
      clientId: client?.id ?? "",
      clientName: client?.name ?? "—",
      clientCompany: client?.company ?? null,
      statusLabel: statusInfo?.label ?? null,
      statusColor: statusInfo?.color ?? null,
      total: deliverables.length,
      draft: deliverables.filter((d) => d.status === "draft").length,
      published: deliverables.filter((d) => d.status === "published").length,
      submitted: deliverables.filter((d) => d.status === "submitted").length,
      approved: deliverables.filter((d) => d.status === "approved").length,
    };
  });

  // Sort: submitted first (need attention), then by name
  rows.sort((a, b) => {
    if (b.submitted !== a.submitted) return b.submitted - a.submitted;
    if (b.published !== a.published) return b.published - a.published;
    return a.clientName.localeCompare(b.clientName);
  });

  const totalSubmitted = rows.reduce((s, r) => s + r.submitted, 0);

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8 flex-wrap">
        <div>
          <h1 className="font-heading text-xl md:text-2xl text-gray-900">
            Entregables
          </h1>
          <p className="text-sm text-gray-500">
            Formularios y decisiones por cliente.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-white text-xs gap-1.5"
        >
          <Link href="/dashboard/deliverables/new">
            <Plus className="w-3.5 h-3.5" />
            Nuevo entregable
          </Link>
        </Button>
      </div>

      {/* ── Attention banner ── */}
      {totalSubmitted > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{totalSubmitted}</span> entregable
            {totalSubmitted !== 1 ? "s" : ""} esperando revisión del equipo.
          </p>
        </div>
      )}

      {/* ── Table ── */}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pl-5 pr-3">
                    Cliente
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">
                    Estado
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">
                    Total
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">
                    Borradores
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">
                    Esperando cliente
                  </th>
                  <th className="text-center text-xs font-semibold text-amber-600 uppercase tracking-wider py-3 px-3">
                    Para revisar
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">
                    Aprobados
                  </th>
                  <th className="py-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={row.setId}
                    className={
                      row.submitted > 0
                        ? "bg-amber-50/40 hover:bg-amber-50/70 transition-colors"
                        : "hover:bg-gray-50/60 transition-colors"
                    }
                  >
                    <td className="py-3.5 pl-5 pr-3">
                      <p className="font-medium text-gray-800">{row.clientName}</p>
                      {row.clientCompany && (
                        <p className="text-xs text-gray-400">{row.clientCompany}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {row.statusLabel ? (
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadgeClass(row.statusColor)}`}
                        >
                          {row.statusLabel}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {row.total}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <CountPill value={row.draft} color="gray" />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <CountPill value={row.published} color="blue" />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <CountPill value={row.submitted} color="amber" bold />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <CountPill value={row.approved} color="green" />
                    </td>
                    <td className="py-3.5 pr-5 pl-3 text-right">
                      <Link
                        href={`/dashboard/clients/${row.clientId}#deliverables`}
                        className="text-xs font-medium text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map((row) => (
              <Link
                key={row.setId}
                href={`/dashboard/clients/${row.clientId}`}
                className={`block rounded-xl border bg-white p-4 transition-colors ${
                  row.submitted > 0
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {row.clientName}
                    </p>
                    {row.clientCompany && (
                      <p className="text-xs text-gray-400">{row.clientCompany}</p>
                    )}
                  </div>
                  {row.statusLabel && (
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${statusBadgeClass(row.statusColor)}`}
                    >
                      {row.statusLabel}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.draft > 0 && (
                    <Pill label="Borrador" value={row.draft} color="gray" />
                  )}
                  {row.published > 0 && (
                    <Pill label="Esperando" value={row.published} color="blue" />
                  )}
                  {row.submitted > 0 && (
                    <Pill label="Para revisar" value={row.submitted} color="amber" />
                  )}
                  {row.approved > 0 && (
                    <Pill label="Aprobados" value={row.approved} color="green" />
                  )}
                  {row.total === 0 && (
                    <span className="text-xs text-gray-400">Sin entregables</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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

function CountPill({
  value,
  color,
  bold,
}: {
  value: number;
  color: "gray" | "blue" | "amber" | "green";
  bold?: boolean;
}) {
  if (value === 0)
    return <span className="text-xs text-gray-200 font-mono">—</span>;

  const cls = {
    gray:  "bg-gray-100 text-gray-500",
    blue:  "bg-blue-50 text-blue-600",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-50 text-green-700",
  }[color];

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${cls} ${
        bold ? "font-bold" : "font-medium"
      }`}
    >
      {value}
    </span>
  );
}

function Pill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "blue" | "amber" | "green";
}) {
  const cls = {
    gray:  "bg-gray-100 text-gray-600",
    blue:  "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
  }[color];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <span className="font-bold">{value}</span> {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-14 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">
        Sin entregables todavía
      </p>
      <p className="text-xs text-gray-400 max-w-xs mx-auto mb-5">
        Crea el primer entregable para un cliente usando el botón de arriba.
      </p>
      <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
        <Link href="/dashboard/deliverables/new">
          <Plus className="w-3.5 h-3.5" />
          Nuevo entregable
        </Link>
      </Button>
    </div>
  );
}
