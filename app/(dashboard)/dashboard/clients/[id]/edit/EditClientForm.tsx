"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatMexPhone } from "@/lib/utils";
import { updateClientContact } from "./actions";

type Props = {
  clientId: string;
  initialName: string;
  initialEmail: string | null;
  initialPhone: string | null;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-sm font-normal text-gray-500">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
  );
}

const inputClass =
  "h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400";

export function EditClientForm({ clientId, initialName, initialEmail, initialPhone }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(formatMexPhone(initialPhone ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "El nombre es obligatorio.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Ingresa un correo electrónico válido.";
    return next;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      try {
        await updateClientContact(clientId, {
          name,
          email: email || null,
          phone: phone || null,
        });
        router.push(`/dashboard/clients/${clientId}`);
      } catch {
        setServerError("Ocurrió un error al guardar los cambios. Intenta de nuevo.");
      }
    });
  }

  const hasChanges =
    name !== initialName ||
    email !== (initialEmail ?? "") ||
    phone !== (initialPhone ?? "");

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-8 space-y-5">

          {/* Name */}
          <div className="space-y-1.5">
            <FieldLabel required>Nombre completo</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. María García"
              className={inputClass}
              disabled={isPending}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
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
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <FieldLabel>Teléfono</FieldLabel>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatMexPhone(e.target.value))}
              placeholder="(123) 456-7890"
              inputMode="numeric"
              className={inputClass}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {serverError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          className="h-9 border-gray-200 text-gray-600 hover:text-gray-900"
          disabled={isPending}
        >
          <Link href={`/dashboard/clients/${clientId}`}>Cancelar</Link>
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !hasChanges}
          className="h-9 bg-brand-500 hover:bg-brand-600 text-white min-w-32"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner size="xs" className="text-white" />
              Guardando…
            </span>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
