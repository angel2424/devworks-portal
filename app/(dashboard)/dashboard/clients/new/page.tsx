export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewClientForm } from "@/components/dashboard/clients/new-client-form";
import type { StatusOption, TeamMember } from "@/components/dashboard/clients/new-client-form";

export default async function NewClientPage() {
  const supabase = await createClient();

  const { data: rawStatuses } = await supabase
    .from("catalog_status")
    .select("id, label, color, is_default")
    .eq("category", "client")
    .order("order_index");

  const { data: rawTeam } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "team")
    .order("full_name");

  const statuses: StatusOption[] = (rawStatuses ?? []) as StatusOption[];
  const teamMembers: TeamMember[] = (rawTeam ?? []) as TeamMember[];

  // Pick the default status or fall back to the first one
  const defaultStatus =
    (rawStatuses ?? []).find((s: any) => s.is_default) ?? rawStatuses?.[0];

  return (
    <div className="px-8 py-8 max-w-2xl">

      {/* ── Back link ── */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-6 transition-colors group"
      >
        <svg
          className="w-3 h-3 transition-transform group-hover:-translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a clientes
      </Link>

      {/* ── Page header ── */}
      <div className="mb-7">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-1">
          Nuevo cliente
        </h1>
        <p className="text-sm text-gray-500">
          Agrega un contacto al pipeline CRM.
        </p>
      </div>

      <NewClientForm
        statuses={statuses}
        teamMembers={teamMembers}
        defaultStatusId={defaultStatus?.id ?? ""}
      />
    </div>
  );
}
