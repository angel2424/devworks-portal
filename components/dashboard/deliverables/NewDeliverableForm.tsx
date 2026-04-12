"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createDeliverable } from "@/app/(dashboard)/dashboard/clients/[id]/deliverables/actions";
import type { DeliverableType, FieldType } from "@/lib/deliverables/types";
import { FIELD_TYPE_LABEL } from "@/lib/deliverables/types";
import { Plus, Trash2 } from "lucide-react";

// ─── Local types ──────────────────────────────────────────────────────────────

type FieldRow = {
  _key: string;
  label: string;
  hint: string;
  field_type: FieldType;
  required: boolean;
};

type OptionRow = {
  _key: string;
  label: string;
  description: string;
};

const newField = (): FieldRow => ({
  _key: crypto.randomUUID(),
  label: "",
  hint: "",
  field_type: "text",
  required: true,
});

const newOption = (): OptionRow => ({
  _key: crypto.randomUUID(),
  label: "",
  description: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

export function NewDeliverableForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<DeliverableType>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldRow[]>([newField()]);
  const [options, setOptions] = useState<OptionRow[]>([newOption(), newOption()]);
  const [error, setError] = useState<string | null>(null);

  // ── Field helpers ──
  const updateField = (key: string, patch: Partial<FieldRow>) =>
    setFields((prev) =>
      prev.map((f) => (f._key === key ? { ...f, ...patch } : f))
    );

  const removeField = (key: string) =>
    setFields((prev) => prev.filter((f) => f._key !== key));

  // ── Option helpers ──
  const updateOption = (key: string, patch: Partial<OptionRow>) =>
    setOptions((prev) =>
      prev.map((o) => (o._key === key ? { ...o, ...patch } : o))
    );

  const removeOption = (key: string) =>
    setOptions((prev) => prev.filter((o) => o._key !== key));

  // ── Submit ──
  const handleSubmit = () => {
    if (!title.trim()) {
      setError("El título es requerido.");
      return;
    }
    if (type === "form" && fields.some((f) => !f.label.trim())) {
      setError("Todos los campos deben tener un nombre.");
      return;
    }
    if (type === "decision" && options.filter((o) => o.label.trim()).length < 2) {
      setError("Agrega al menos dos opciones.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const id = await createDeliverable(clientId, {
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          fields:
            type === "form"
              ? fields.map((f) => ({
                  label: f.label.trim(),
                  hint: f.hint.trim() || undefined,
                  field_type: f.field_type,
                  required: f.required,
                }))
              : undefined,
          options:
            type === "decision"
              ? options
                  .filter((o) => o.label.trim())
                  .map((o) => ({
                    label: o.label.trim(),
                    description: o.description.trim() || undefined,
                  }))
              : undefined,
        });
        router.push(`/dashboard/clients/${clientId}/deliverables/${id}`);
      } catch {
        setError("Ocurrió un error al guardar. Inténtalo de nuevo.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Type selector ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Tipo de entregable
        </p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          {(["form", "decision"] as DeliverableType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                type === t
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-medium text-gray-800">
                {t === "form" ? "Solicitud de datos" : "Decisión"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                {t === "form"
                  ? "El cliente llena un formulario"
                  : "El cliente elige entre opciones"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Title & description ── */}
      <div className="grid gap-5 sm:max-w-lg">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Título
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "form"
                ? "Ej. Información para el sitio web"
                : "Ej. Selección de dominio"
            }
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Descripción <span className="font-normal normal-case text-gray-400">(opcional)</span>
          </Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Instrucciones adicionales para el cliente…"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 resize-none"
          />
        </div>
      </div>

      {/* ── Form fields ── */}
      {type === "form" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Campos
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setFields((prev) => [...prev, newField()])}
            >
              <Plus className="w-3 h-3" />
              Agregar campo
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field._key}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3 mb-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Nombre del campo</Label>
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        updateField(field._key, { label: e.target.value })
                      }
                      placeholder="Ej. Nombre del negocio"
                      className="text-sm h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Tipo de dato</Label>
                    <Select
                      value={field.field_type}
                      onValueChange={(v) =>
                        updateField(field._key, { field_type: v as FieldType })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(FIELD_TYPE_LABEL) as [FieldType, string][]).map(
                          ([val, label]) => (
                            <SelectItem key={val} value={val} className="text-sm">
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">
                      Pista <span className="font-normal text-gray-400">(opcional)</span>
                    </Label>
                    <Input
                      value={field.hint}
                      onChange={(e) =>
                        updateField(field._key, { hint: e.target.value })
                      }
                      placeholder="Ej. Incluye el nombre completo registrado"
                      className="text-sm h-8"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-6">
                    <Checkbox
                      id={`req-${field._key}`}
                      checked={field.required}
                      onCheckedChange={(v) =>
                        updateField(field._key, { required: Boolean(v) })
                      }
                    />
                    <Label
                      htmlFor={`req-${field._key}`}
                      className="text-xs text-gray-500 cursor-pointer"
                    >
                      Requerido
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(field._key)}
                    disabled={fields.length === 1}
                    className="mt-6 p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Decision options ── */}
      {type === "decision" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Opciones
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setOptions((prev) => [...prev, newOption()])}
            >
              <Plus className="w-3 h-3" />
              Agregar opción
            </Button>
          </div>

          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div
                key={opt._key}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-2 w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Opción</Label>
                      <Input
                        value={opt.label}
                        onChange={(e) =>
                          updateOption(opt._key, { label: e.target.value })
                        }
                        placeholder="Ej. devworks.com.mx"
                        className="text-sm h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        Descripción{" "}
                        <span className="font-normal text-gray-400">(opcional)</span>
                      </Label>
                      <Input
                        value={opt.description}
                        onChange={(e) =>
                          updateOption(opt._key, { description: e.target.value })
                        }
                        placeholder="Ej. Disponible — $12/año"
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(opt._key)}
                    disabled={options.length <= 2}
                    className="mt-6 p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-gray-900 hover:bg-gray-800 text-white text-sm"
        >
          {isPending ? "Guardando…" : "Guardar borrador"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-sm text-gray-500"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
