export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditClientForm } from "./EditClientForm";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, phone, company")
    .eq("id", id)
    .single();

  if (!client) notFound();

  return (
    <div className="px-8 py-8 max-w-lg mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-7">
        <Link href="/dashboard/clients" className="hover:text-gray-600 transition-colors">
          Clientes
        </Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/dashboard/clients/${id}`} className="hover:text-gray-600 transition-colors">
          {client.name}
        </Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 font-medium">Editar contacto</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <Avatar className="h-10 w-10 rounded-xl shrink-0">
          <AvatarFallback className="rounded-xl bg-brand-50 text-brand-600 text-sm">
            {initials(client.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-xl text-gray-900">Editar contacto</h1>
          {client.company && (
            <p className="text-xs text-gray-400 mt-0.5">{client.company}</p>
          )}
        </div>
      </div>

      <EditClientForm
        clientId={client.id}
        initialName={client.name}
        initialEmail={client.email}
        initialPhone={client.phone}
      />
    </div>
  );
}
