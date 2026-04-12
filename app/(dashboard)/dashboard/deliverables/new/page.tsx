export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClientPickerList } from "@/components/dashboard/deliverables/ClientPickerList";

export default async function NewDeliverablePickerPage() {
  const supabase = await createClient();

  const { data: rawClients } = await supabase
    .from("clients")
    .select(`
      id, name, company, email,
      status:catalog_status!status_id(label, color)
    `)
    .order("name");

  const clients = (rawClients ?? []).map((c) => {
    const s = Array.isArray(c.status) ? c.status[0] : c.status;
    return {
      id: c.id,
      name: c.name,
      company: c.company ?? null,
      email: c.email ?? null,
      statusLabel: s?.label ?? null,
      statusColor: s?.color ?? null,
    };
  });

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-7 px-2 flex-wrap">
        <Link
          href="/dashboard/deliverables"
          className="hover:text-gray-600 transition-colors"
        >
          Entregables
        </Link>
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 font-medium">Nuevo entregable</span>
      </nav>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="font-heading text-xl text-gray-900">
            Selecciona un cliente
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            El entregable se creará dentro del perfil del cliente seleccionado.
          </p>
        </div>

        <div className="px-4 py-4">
          {clients.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400 mb-3">
                No hay clientes registrados todavía.
              </p>
              <Link
                href="/dashboard/clients/new"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Crear primer cliente →
              </Link>
            </div>
          ) : (
            <ClientPickerList clients={clients} />
          )}
        </div>
      </div>
    </div>
  );
}
