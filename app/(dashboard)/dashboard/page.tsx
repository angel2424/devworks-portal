import { createClient } from "@/lib/supabase/server";

// Stat card component
function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  accent?: boolean;
}) {
  return (
    <div className={`
      rounded-lg border p-5 flex flex-col gap-3
      ${accent
        ? "bg-brand-50 border-brand-200"
        : "bg-white border-gray-200"
      }
    `}>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <p className={`font-heading text-3xl font-semibold ${accent ? "text-brand-600" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sublabel}</p>
    </div>
  );
}

// Quick action button
function QuickAction({
  label,
  description,
  href,
  icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-4 p-4 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group"
    >
      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </a>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "equipo";

  // We'll add real DB queries once the database is set up
  const stats = {
    activeProjects: 0,
    totalClients: 0,
    openTasks: 0,
  };

  return (
    <div className="px-8 py-8 max-w-6xl">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-1">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-gray-500">
          Aquí está el resumen de tu espacio de trabajo.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Proyectos activos"
          value={stats.activeProjects}
          sublabel="En este momento"
          accent
        />
        <StatCard
          label="Clientes"
          value={stats.totalClients}
          sublabel="En el CRM"
        />
        <StatCard
          label="Tareas abiertas"
          value={stats.openTasks}
          sublabel="En todos los proyectos"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-6">
        {/* Recent activity - wider column */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-gray-900">
              Actividad reciente
            </h2>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <EmptyState
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              message="No hay actividad todavía"
              sub="Aparecerá aquí cuando empieces a trabajar en proyectos."
            />
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-6">
          {/* Quick actions */}
          <div>
            <h2 className="font-heading text-base font-semibold text-gray-900 mb-4">
              Acciones rápidas
            </h2>
            <div className="space-y-2">
              <QuickAction
                label="Nuevo cliente"
                description="Agregar al CRM"
                href="/dashboard/clients/new"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                }
              />
              <QuickAction
                label="Nuevo proyecto"
                description="Iniciar un proyecto"
                href="/dashboard/projects/new"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                }
              />
              <QuickAction
                label="Portal del cliente"
                description="Ver como cliente"
                href="/portal"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <h2 className="font-heading text-base font-semibold text-gray-900 mb-4">
              Próximos vencimientos
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <EmptyState
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                }
                message="Sin vencimientos"
                sub="Los vencimientos de tareas aparecerán aquí."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  message,
  sub,
}: {
  icon: React.ReactNode;
  message: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{message}</p>
      <p className="text-xs text-gray-400 max-w-xs">{sub}</p>
    </div>
  );
}
