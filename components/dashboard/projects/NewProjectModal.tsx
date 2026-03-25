"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientOption = {
  id: string;
  name: string;
  company: string | null;
};

export type StatusOption = {
  id: string;
  label: string;
  color: string | null;
  is_default: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  statuses: StatusOption[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-brand-500 ml-0.5">*</span>}
    </Label>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewProjectModal({ open, onOpenChange, clients, statuses }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0];

  const [name, setName]             = useState("");
  const [clientId, setClientId]     = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId]     = useState(defaultStatus?.id ?? "");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setClientId("");
    setDescription("");
    setStatusId(defaultStatus?.id ?? "");
    setStartDate("");
    setEndDate("");
    setErrors({});
    setServerError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim())    next.name     = "El nombre del proyecto es obligatorio.";
    if (!clientId)       next.clientId = "Selecciona el cliente del proyecto.";
    if (startDate && endDate && endDate < startDate)
      next.endDate = "La fecha de entrega debe ser posterior al inicio.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name:        name.trim(),
          description: description.trim() || null,
          client_id:   clientId,
          status_id:   statusId || undefined,
          start_date:  startDate || null,
          end_date:    endDate || null,
          created_by:  user?.id ?? null,
        })
        .select("id")
        .single();

      if (error) {
        setServerError("Error al crear el proyecto. Intenta de nuevo.");
        return;
      }

      // The DB trigger has already fired at this point —
      // phases and tasks exist by the time we navigate.
      handleOpenChange(false);
      router.push(`/dashboard/projects/${data.id}`);
    });
  }

  const inputClass =
    "h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
            </div>
            <div>
              <DialogTitle className="font-heading text-lg text-gray-900 leading-tight">
                Nuevo proyecto
              </DialogTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                Se crearán 68 tareas y 3 fases automáticamente.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <FieldLabel required>Nombre del proyecto</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Sitio web Construcciones ABC"
                className={inputClass}
                disabled={isPending}
                autoFocus
              />
              {errors.name && <FieldError message={errors.name} />}
            </div>

            {/* Client */}
            <div className="space-y-1.5">
              <FieldLabel required>Cliente</FieldLabel>
              <Select value={clientId} onValueChange={setClientId} disabled={isPending}>
                <SelectTrigger className="h-9 w-full text-sm bg-white border-gray-200 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="Seleccionar cliente…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-center text-gray-400">
                      No hay clientes registrados todavía.
                    </div>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span>{c.name}</span>
                        {c.company && (
                          <span className="text-gray-400 ml-1.5">· {c.company}</span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.clientId && <FieldError message={errors.clientId} />}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <FieldLabel>Estado</FieldLabel>
              <Select value={statusId} onValueChange={setStatusId} disabled={isPending}>
                <SelectTrigger className="h-9 w-full text-sm bg-white border-gray-200">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Fecha de inicio</FieldLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Fecha de entrega</FieldLabel>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                  disabled={isPending}
                  min={startDate || undefined}
                />
                {errors.endDate && <FieldError message={errors.endDate} />}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <FieldLabel>Descripción</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción del alcance del proyecto…"
                rows={3}
                disabled={isPending}
                className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-400 disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400 hidden sm:block">
              El trigger de la base de datos crea las tareas al guardar.
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="h-9 border-gray-200 text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || clients.length === 0}
                className="h-9 bg-brand-500 hover:bg-brand-600 text-white min-w-32"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="xs" className="text-white" />
                    Creando…
                  </span>
                ) : (
                  "Crear proyecto"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
