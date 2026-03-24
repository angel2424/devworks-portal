export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { MobileBottomNav } from "@/components/dashboard/mobile-nav";

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
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-white border-r border-gray-200">
        {/* Wordmark */}
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-heading text-lg font-semibold text-gray-900 tracking-tight">
              DevWorks<span className="text-brand-500">.</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <DashboardNav />
        </nav>

        {/* User menu at bottom */}
        <div className="border-t border-gray-200 p-3">
          <UserMenu
            email={user.email ?? ""}
            displayName={displayName}
            initials={avatarInitials}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Top bar */}
        <header className="h-14 flex items-center px-4 md:px-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex-shrink-0">
          {/* Mobile: logo */}
          <Link href="/dashboard" className="flex md:hidden items-center">
            <span className="font-heading text-lg font-semibold text-gray-900 tracking-tight">
              DevWorks<span className="text-brand-500">.</span>
            </span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notification bell placeholder */}
            <button className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            {/* Mobile: compact user menu in header */}
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

        {/* Page content — extra bottom padding on mobile for the bottom nav */}
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
