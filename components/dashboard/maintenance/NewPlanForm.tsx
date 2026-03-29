"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlan } from "@/app/(dashboard)/dashboard/maintenance/actions";

type ClientOption = { id: string; name: string; company: string | null };
type ProjectOption = { id: string; name: string; client_id: string | null };

interface Props {
  clients: ClientOption[];
  projects: ProjectOption[];
}

export function NewPlanForm({ clients, projects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"spt" | "recurring">("recurring");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState<string | null>(null);

  // Filter projects to the selected client (if any)
  const availableProjects =
    clientId
      ? projects.filter((p) => !p.client_id || p.client_id === clientId)
      : projects;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("type", type);
    formData.set("client_id", clientId);
    formData.set("start_date", startDate);
    if (type === "spt") formData.set("project_id", projectId);

    startTransition(async () => {
      try {
        await createPlan(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Type selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Tipo de plan <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <TypeCard
            value="recurring"
            selected={type === "recurring"}
            onSelect={() => { setType("recurring"); setProjectId(""); }}
            title="Recurrente"
            description="Mantenimiento mensual indefinido. Se desactiva manualmente."
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            }
          />
          <TypeCard
            value="spt"
            selected={type === "spt"}
            onSelect={() => setType("spt")}
            title="Sistema Presencia Total™"
            description="Mantenimiento post-lanzamiento. Duración fija de 5 meses."
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Client */}
      <div className="space-y-2">
        <Label htmlFor="client_id" className="text-sm font-medium text-gray-700">
          Cliente <span className="text-red-500">*</span>
        </Label>
        <Select
          value={clientId}
          onValueChange={(v) => { setClientId(v); setProjectId(""); }}
          required
        >
          <SelectTrigger id="client_id" className="h-10 bg-white border-gray-200 text-sm">
            <SelectValue placeholder="Selecciona un cliente…" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.company && <span className="text-gray-400 ml-1.5">· {c.company}</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project (SPT only) */}
      {type === "spt" && (
        <div className="space-y-2">
          <Label htmlFor="project_id" className="text-sm font-medium text-gray-700">
            Proyecto vinculado <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-gray-500">
            El proyecto de sitio web completado que activa este plan SPT.
          </p>
          <Select
            value={projectId}
            onValueChange={setProjectId}
            required={type === "spt"}
          >
            <SelectTrigger id="project_id" className="h-10 bg-white border-gray-200 text-sm">
              <SelectValue placeholder="Selecciona un proyecto…" />
            </SelectTrigger>
            <SelectContent>
              {availableProjects.length === 0 ? (
                <div className="py-3 px-3 text-sm text-gray-400 text-center">
                  No hay proyectos disponibles
                </div>
              ) : (
                availableProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Start date */}
      <div className="space-y-2">
        <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
          Fecha de inicio <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-gray-500">
          {type === "spt"
            ? "Primer día del primer mes de mantenimiento. La fecha de fin se calcula automáticamente (inicio + 5 meses)."
            : "Primer día del primer mes de mantenimiento."}
        </p>
        <Input
          id="start_date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="h-10 bg-white border-gray-200 text-sm max-w-xs"
        />
        {type === "spt" && startDate && (
          <p className="text-xs text-gray-400">
            Finaliza:{" "}
            <span className="font-medium text-gray-600">
              {(() => {
                const [y, mo, day] = startDate.split("-").map(Number);
                const d = new Date(y, mo - 1 + 5, day);
                return d.toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                });
              })()}
            </span>
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || !clientId || !startDate || (type === "spt" && !projectId)}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando plan…
            </span>
          ) : (
            "Crear plan"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// ─── TypeCard ─────────────────────────────────────────────────────────────────

function TypeCard({
  selected,
  onSelect,
  title,
  description,
  icon,
}: {
  value: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "text-left rounded-xl border p-4 transition-all",
        selected
          ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className={cn("mb-3 w-9 h-9 rounded-lg flex items-center justify-center", selected ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-500")}>
        {icon}
      </div>
      <p className={cn("text-sm font-semibold mb-1", selected ? "text-brand-700" : "text-gray-800")}>
        {title}
      </p>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </button>
  );
}
