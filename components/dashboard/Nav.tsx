"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type SingleEntry = {
  type: "item"
  label: string
  href: string
  exact?: boolean
  icon: React.ReactNode
}

type GroupEntry = {
  type: "group"
  label: string
  icon: React.ReactNode
  children: { label: string; href: string }[]
}

type NavEntry = SingleEntry | GroupEntry

const navEntries: NavEntry[] = [
  {
    type: "item",
    label: "Resumen",
    href: "/dashboard",
    exact: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    type: "item",
    label: "Clientes",
    href: "/dashboard/clients",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    type: "group",
    label: "Proyectos",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    children: [
      { label: "Proyectos", href: "/dashboard/projects" },
      { label: "Tareas", href: "/dashboard/tasks" },
    ],
  },
  {
    type: "group",
    label: "Servicios",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    children: [
      { label: "Mantenimiento", href: "/dashboard/maintenance" },
      { label: "Entregables", href: "/dashboard/deliverables" },
    ],
  },
  {
    type: "item",
    label: "Knowledge Base",
    href: "/dashboard/knowledge",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
]

function NavGroupSection({ entry }: { entry: GroupEntry }) {
  const pathname = usePathname()
  const isAnyActive = entry.children.some((child) =>
    pathname.startsWith(child.href)
  )
  const [open, setOpen] = useState(isAnyActive)

  useEffect(() => {
    if (isAnyActive) setOpen(true)
  }, [isAnyActive])

  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150",
          isAnyActive
            ? "text-gray-900 font-medium"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        )}
      >
        <span
          className={cn(
            "shrink-0",
            isAnyActive ? "text-brand-500" : "text-gray-400"
          )}
        >
          {entry.icon}
        </span>
        <span className="flex-1 text-left">{entry.label}</span>
        <svg
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
            open && "rotate-90"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {open && (
        <ul className="mt-0.5 ml-5 pl-3 border-l border-gray-100 space-y-0.5">
          {entry.children.map((child) => {
            const isActive = pathname.startsWith(child.href)
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150",
                    isActive
                      ? "bg-brand-50 text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {isActive && (
                    <span className="w-1 h-3 rounded-full bg-brand-500 shrink-0" />
                  )}
                  {child.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <ul className="space-y-0.5">
      {navEntries.map((entry, i) => {
        if (entry.type === "group") {
          return <NavGroupSection key={i} entry={entry} />
        }

        const isActive = entry.exact
          ? pathname === entry.href
          : pathname.startsWith(entry.href)

        return (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150",
                isActive
                  ? "bg-brand-50 text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )}
            >
              <span
                className={cn(
                  "shrink-0",
                  isActive ? "text-brand-500" : "text-gray-400"
                )}
              >
                {entry.icon}
              </span>
              {entry.label}
              {isActive && (
                <span className="ml-auto w-1 h-4 rounded-full bg-brand-500" />
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
