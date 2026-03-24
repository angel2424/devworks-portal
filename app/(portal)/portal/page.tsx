import { createClient } from "@/lib/supabase/server";

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "cliente";

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-10">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-1">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-gray-500">
          Aquí puedes seguir el avance de tu proyecto en tiempo real.
        </p>
      </div>

      {/* Empty state — project overview will go here once DB is ready */}
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-6 h-6 text-brand-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
        </div>
        <h2 className="font-heading text-lg font-semibold text-gray-800 mb-2">
          Tu proyecto estará aquí pronto
        </h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          En cuanto iniciemos el proyecto, podrás ver todas las fases, tareas,
          entregables y pagos desde este portal.
        </p>
      </div>

      {/* Feature preview cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            label: "Aprobación de entregables",
            desc: "Revisa y aprueba diseños directamente aquí.",
          },
          {
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            ),
            label: "Pagos en línea",
            desc: "Visualiza y paga tus facturas fácilmente.",
          },
          {
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            ),
            label: "Tu contrato",
            desc: "Firma digital y acceso permanente al documento.",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-100 bg-white p-5 flex gap-4"
          >
            <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
