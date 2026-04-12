"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitFormResponse, submitDecisionResponse } from "../actions";
import type { FieldType } from "@/lib/deliverables/types";
import { FIELD_TYPE_LABEL } from "@/lib/deliverables/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Field = {
  id: string;
  label: string;
  hint: string | null;
  field_type: FieldType;
  required: boolean;
  order_index: number;
};

type Option = {
  id: string;
  label: string;
  description: string | null;
  order_index: number;
};

// ─── Form response ────────────────────────────────────────────────────────────

export function FormResponseForm({
  deliverableId,
  fields,
}: {
  deliverableId: string;
  fields: Field[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.id, ""]))
  );
  const [error, setError] = useState<string | null>(null);

  const sorted = [...fields].sort((a, b) => a.order_index - b.order_index);

  const handleSubmit = () => {
    // Validate required fields
    const missing = sorted.filter(
      (f) => f.required && !values[f.id]?.trim()
    );
    if (missing.length) {
      setError(
        `Completa los campos requeridos: ${missing.map((f) => f.label).join(", ")}.`
      );
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitFormResponse(
        deliverableId,
        sorted.map((f) => ({
          field_id: f.id,
          value_text: values[f.id]?.trim() || undefined,
        }))
      );
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/portal/deliverables");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {sorted.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && (
              <span className="ml-1 text-red-400 text-xs">*</span>
            )}
            <span className="ml-2 text-xs font-normal text-gray-400">
              {FIELD_TYPE_LABEL[field.field_type]}
            </span>
          </label>
          {field.hint && (
            <p className="text-xs text-gray-400">{field.hint}</p>
          )}
          <FieldInput
            field={field}
            value={values[field.id] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-gray-900 hover:bg-gray-800 text-white text-sm"
        >
          {isPending ? "Enviando…" : "Enviar respuesta"}
        </Button>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.field_type === "long_text") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 resize-none"
        placeholder="Escribe tu respuesta…"
      />
    );
  }

  if (field.field_type === "date") {
    return (
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm max-w-xs"
      />
    );
  }

  if (field.field_type === "image" || field.field_type === "file") {
    return (
      <div className="space-y-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pega el enlace del archivo (Drive, Dropbox, etc.)"
          className="text-sm"
        />
        <p className="text-xs text-gray-400">
          Sube tu archivo a Google Drive o Dropbox y pega el enlace aquí.
        </p>
      </div>
    );
  }

  // text (default)
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Escribe tu respuesta…"
      className="text-sm"
    />
  );
}

// ─── Decision response ────────────────────────────────────────────────────────

export function DecisionResponseForm({
  deliverableId,
  options,
}: {
  deliverableId: string;
  options: Option[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = [...options].sort((a, b) => a.order_index - b.order_index);

  const handleSubmit = () => {
    if (!selectedId) {
      setError("Selecciona una opción antes de enviar.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitDecisionResponse(
        deliverableId,
        selectedId,
        comment.trim()
      );
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/portal/deliverables");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Options */}
      <div className="space-y-3">
        {sorted.map((opt, idx) => {
          const isSelected = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedId(opt.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                isSelected
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-brand-500 bg-brand-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-gray-800">
                      {opt.label}
                    </p>
                  </div>
                  {opt.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {opt.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Comentarios{" "}
          <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <p className="text-xs text-gray-400">
          Comparte cualquier duda o contexto antes de confirmar tu elección.
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Escribe tus comentarios aquí…"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedId}
          className="bg-gray-900 hover:bg-gray-800 text-white text-sm disabled:opacity-50"
        >
          {isPending ? "Enviando…" : "Confirmar decisión"}
        </Button>
        <p className="text-xs text-gray-400">
          Tu respuesta será enviada al equipo.
        </p>
      </div>
    </div>
  );
}
