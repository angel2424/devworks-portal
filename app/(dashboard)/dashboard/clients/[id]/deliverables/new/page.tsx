export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewDeliverableForm } from "@/components/dashboard/deliverables/NewDeliverableForm";

export default async function NewDeliverablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!client) notFound();

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-7 px-2 flex-wrap">
        <Link href="/dashboard/clients" className="hover:text-gray-600 transition-colors">
          Clientes
        </Link>
        <ChevronIcon />
        <Link
          href={`/dashboard/clients/${id}`}
          className="hover:text-gray-600 transition-colors"
        >
          {client.name}
        </Link>
        <ChevronIcon />
        <span className="text-gray-600 font-medium">Nuevo entregable</span>
      </nav>

      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <h1 className="font-heading text-xl text-gray-900 mb-1">
          Nuevo entregable
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Para {client.name}
        </p>

        <NewDeliverableForm clientId={id} />
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
