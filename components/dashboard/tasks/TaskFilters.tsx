"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type FilterOption = {
  id: string;
  label: string;
  value: string;
  color?: string | null;
};

interface TaskFiltersProps {
  statuses: FilterOption[];
  priorities: FilterOption[];
}

export function TaskFilters({ statuses, priorities }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const meMode = searchParams.get("me") === "true";
  const expiredOnly = searchParams.get("expired") === "true";
  const activeStatuses = new Set(
    (searchParams.get("status") ?? "").split(",").filter(Boolean)
  );
  const activePriorities = new Set(
    (searchParams.get("priority") ?? "").split(",").filter(Boolean)
  );
  const currentQ = searchParams.get("q") ?? "";

  const [searchValue, setSearchValue] = useState(currentQ);

  // Sync search input if URL param changes externally (e.g. clear all)
  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Debounce search → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("q", searchValue);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const toggleMe = () => updateParam("me", meMode ? null : "true");
  const toggleExpired = () => updateParam("expired", expiredOnly ? null : "true");

  const toggleStatus = (value: string) => {
    const next = new Set(activeStatuses);
    next.has(value) ? next.delete(value) : next.add(value);
    updateParam("status", next.size ? [...next].join(",") : null);
  };

  const togglePriority = (value: string) => {
    const next = new Set(activePriorities);
    next.has(value) ? next.delete(value) : next.add(value);
    updateParam("priority", next.size ? [...next].join(",") : null);
  };

  const clearAll = () => {
    setSearchValue("");
    router.push(pathname);
  };

  const hasActiveFilters =
    expiredOnly ||
    activeStatuses.size > 0 ||
    activePriorities.size > 0 ||
    currentQ;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar tarea…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-sm rounded-full border border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 w-44 transition-all"
        />
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Me mode */}
      <button
        onClick={toggleMe}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
          meMode
            ? "bg-brand-500 border-brand-500 text-white shadow-sm"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        Yo
      </button>

      {/* Expired toggle */}
      <button
        onClick={toggleExpired}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
          expiredOnly
            ? "bg-amber-500 border-amber-500 text-white shadow-sm"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        Vencidas
      </button>

      {statuses.length > 0 && <div className="h-5 w-px bg-gray-200" />}

      {/* Status pills */}
      {statuses.map((s) => {
        const isActive = activeStatuses.has(s.value);
        const dotColor = s.color?.startsWith("#") ? s.color : "#9ca3af";
        return (
          <button
            key={s.id}
            onClick={() => toggleStatus(s.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
              isActive
                ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: dotColor }}
            />
            {s.label}
          </button>
        );
      })}

      {priorities.length > 0 && <div className="h-5 w-px bg-gray-200" />}

      {/* Priority pills */}
      {priorities.map((p) => {
        const isActive = activePriorities.has(p.value);
        const pillColor = p.color?.startsWith("#") ? p.color : "#6b7280";
        return (
          <button
            key={p.id}
            onClick={() => togglePriority(p.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
              isActive
                ? "border-transparent text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            )}
            style={
              isActive
                ? { backgroundColor: pillColor, borderColor: pillColor }
                : undefined
            }
          >
            {p.label}
          </button>
        );
      })}

      {hasActiveFilters && (
        <>
          <div className="h-5 w-px bg-gray-200" />
          <button
            onClick={clearAll}
            className="px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Limpiar
          </button>
        </>
      )}
    </div>
  );
}
