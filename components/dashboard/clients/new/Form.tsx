"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

export type StatusOption = {
  id: string;
  label: string;
  color: string | null;
};

export type TeamMember = {
  id: string;
  full_name: string | null;
};

type Props = {
  statuses: StatusOption[];
  teamMembers: TeamMember[];
  defaultStatusId: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-sm font-normal text-gray-500">
      {children}
    </Label>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

export function NewClientForm({ statuses, teamMembers, defaultStatusId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [statusId, setStatusId] = useState(defaultStatusId);
  const [assignedTo, setAssignedTo] = useState("unassigned");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "El nombre es obligatorio.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Ingresa un correo electrónico válido.";
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
        .from("clients")
        .insert({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null,
          notes: notes.trim() || null,
          status_id: statusId,
          assigned_to: assignedTo === "unassigned" ? null : assignedTo,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (error) {
        setServerError("Ocurrió un error al guardar el cliente. Intenta de nuevo.");
        return;
      }

      router.push(`/dashboard/clients/${data.id}`);
    });
  }

  const inputClass =
    "h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Contact info ── */}
        <div className="px-6 py-10 border-b border-gray-100">
          <p className="text-sm font-bold text-brand-500 uppercase">
            Información de contacto
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 my-4">

            <div className="space-y-1.5">
              <FieldLabel>Nombre completo *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María García"
                className={inputClass}
                disabled={isPending}
              />
              {errors.name && <FieldError message={errors.name} />}
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Empresa</FieldLabel>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej. Construcciones ABC"
                className={inputClass}
                disabled={isPending}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <FieldLabel>Correo electrónico</FieldLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@empresa.com"
                className={inputClass}
                disabled={isPending}
              />
              {errors.email && <FieldError message={errors.email} />}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <FieldLabel>Teléfono</FieldLabel>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 123 456 7890"
                className={inputClass}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* ── CRM fields ── */}
        <div className="px-6 py-10 border-b border-gray-100">
          <p className="text-sm font-bold text-brand-500 uppercase mb-4">
            Pipeline CRM
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

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

            {/* Assigned to */}
            <div className="space-y-1.5">
              <FieldLabel>Responsable</FieldLabel>
              <Select value={assignedTo} onValueChange={setAssignedTo} disabled={isPending}>
                <SelectTrigger className="h-9 w-full text-sm bg-white border-gray-200">
                  <SelectValue placeholder="Asignar a..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name ?? m.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="px-6 py-10">
          <p className="text-sm font-bold text-brand-500 uppercase mb-4">
            Notas internas
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto del primer contacto, referencias, observaciones…"
            rows={4}
            disabled={isPending}
            className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-400 disabled:opacity-50 transition-colors"
          />
        </div>
      </div>

      {/* ── Server error ── */}
      {serverError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          className="h-9 border-gray-200 text-gray-600 hover:text-gray-900"
          disabled={isPending}
        >
          <Link href="/dashboard/clients">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="h-9 bg-brand-500 hover:bg-brand-600 text-white min-w-28"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner size="xs" className="text-white" />
              Guardando…
            </span>
          ) : (
            "Guardar cliente"
          )}
        </Button>
      </div>
    </form>
  );
}
