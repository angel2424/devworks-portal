"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const primaryItems = [
  {
    label: "Resumen",
    href: "/dashboard",
    exact: true,
    icon: (active: boolean) => (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    label: "Clientes",
    href: "/dashboard/clients",
    exact: false,
    icon: (active: boolean) => (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    label: "Proyectos",
    href: "/dashboard/projects",
    exact: false,
    icon: (active: boolean) => (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
        />
      </svg>
    ),
  },
]

const menuActivePaths = [
  "/dashboard/tasks",
  "/dashboard/maintenance",
  "/dashboard/deliverables",
  "/dashboard/knowledge",
  "/dashboard/menu",
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const isMenuActive = menuActivePaths.some((p) => pathname.startsWith(p))

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200">
      <div className="flex items-stretch h-16 safe-area-pb">
        {primaryItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 px-1 transition-all duration-150 relative active:opacity-70",
                isActive ? "text-brand-500" : "text-gray-400"
              )}
            >
              {isActive && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-b-full bg-brand-500" />
              )}
              {item.icon(isActive)}
              <span
                className={cn(
                  "text-[11px] font-medium leading-none truncate w-full text-center",
                  isActive ? "text-brand-600" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        <Link
          href="/dashboard/menu"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 px-1 transition-all duration-150 relative active:opacity-70",
            isMenuActive ? "text-brand-500" : "text-gray-400"
          )}
        >
          {isMenuActive && (
            <span className="absolute top-0 inset-x-3 h-0.5 rounded-b-full bg-brand-500" />
          )}
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={isMenuActive ? 2 : 1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
          <span
            className={cn(
              "text-[11px] font-medium leading-none",
              isMenuActive ? "text-brand-600" : "text-gray-400"
            )}
          >
            Menú
          </span>
        </Link>
      </div>
    </nav>
  )
}
