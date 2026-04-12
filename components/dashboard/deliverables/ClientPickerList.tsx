"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

type ClientOption = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  statusLabel: string | null;
  statusColor: string | null;
};

function statusBadgeClass(color: string | null) {
  switch (color) {
    case "green":  return "bg-green-50 text-green-700 border-green-200";
    case "amber":
    case "yellow": return "bg-amber-50 text-amber-700 border-amber-200";
    case "blue":   return "bg-blue-50 text-blue-700 border-blue-200";
    case "red":    return "bg-red-50 text-red-700 border-red-200";
    default:       return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClientPickerList({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}/deliverables/new`);
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, empresa o email…"
          className="pl-9 text-sm"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-400">
            No se encontraron clientes con &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handleSelect(c.id)}
                className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-brand-50/40 transition-colors text-left rounded-lg"
              >
                <Avatar className="h-9 w-9 rounded-lg shrink-0">
                  <AvatarFallback className="rounded-lg text-sm bg-brand-50 font-semibold text-brand-600">
                    {initials(c.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {c.name}
                  </p>
                  {c.company && (
                    <p className="text-xs text-gray-400 truncate">{c.company}</p>
                  )}
                </div>

                {c.statusLabel && (
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${statusBadgeClass(c.statusColor)}`}
                  >
                    {c.statusLabel}
                  </Badge>
                )}

                <svg
                  className="w-4 h-4 text-gray-300 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
