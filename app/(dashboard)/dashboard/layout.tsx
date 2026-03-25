export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/Nav";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { MobileBottomNav } from "@/components/dashboard/MobileNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Role check: query profiles table (authoritative source for role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

    console.log(profile?.role, profile)

  if (profile?.role !== "team") {
    redirect("/portal");
  }

  const displayName = profile?.full_name
    ?? user.user_metadata?.full_name
    ?? user.email?.split("@")[0]
    ?? "Usuario";

  const avatarInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-gray-200">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="https://storage.googleapis.com/dw-agency/dw-gray-logo.svg" alt="DevWorks Studio | Piedras Negras" className="w-20 h-5 object-contain" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <DashboardNav />
        </nav>

        <div className="border-t border-gray-200 p-3">
          <UserMenu
            email={user.email ?? ""}
            displayName={displayName}
            initials={avatarInitials}
          />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        <header className="h-14 flex items-center px-4 md:px-6 border-b border-gray-200 bg-white/80 backdrop-blur-xs shrink-0">
          <Link href="/dashboard" className="flex md:hidden items-center">
            <img src="https://storage.googleapis.com/dw-agency/dw-gray-logo.svg" alt="DevWorks Studio | Piedras Negras" className="w-30 h-6 object-contain mb-3 mx-auto" />
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <NotificationBell userId={user.id} />
            <div className="md:hidden">
              <UserMenu
                email={user.email ?? ""}
                displayName={displayName}
                initials={avatarInitials}
                compact
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
