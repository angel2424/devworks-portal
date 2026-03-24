export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = user.user_metadata?.full_name
    ?? user.email?.split("@")[0]
    ?? "Cliente";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Wordmark */}
          <Link href="/portal" className="flex items-center gap-2">
            <span className="font-heading text-lg font-semibold text-gray-900 tracking-tight">
              DevWorks<span className="text-brand-500">.</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/portal" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Mi Proyecto
            </Link>
            <Link href="/portal/deliverables" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Entregables
            </Link>
            <Link href="/portal/payments" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Pagos
            </Link>
          </nav>

          {/* Avatar */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{displayName}</span>
            <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-brand-600 font-heading">
                {initials}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
