"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveMetrics } from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions";

type MetricsData = {
  total_clicks: number | null;
  total_impressions: number | null;
  avg_ctr: number | null;
  avg_position: number | null;
  total_sessions: number | null;
  notes: string | null;
} | null;

interface Props {
  monthId: string;
  planId: string;
  current: MetricsData;
  prev: MetricsData;
  onSaved?: () => void;
}

function numOrEmpty(v: number | null | undefined) {
  return v != null ? String(v) : "";
}

export function MetricsForm({ monthId, planId, current, prev, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [clicks, setClicks] = useState(numOrEmpty(current?.total_clicks));
  const [impressions, setImpressions] = useState(numOrEmpty(current?.total_impressions));
  const [ctr, setCtr] = useState(numOrEmpty(current?.avg_ctr));
  const [position, setPosition] = useState(numOrEmpty(current?.avg_position));
  const [sessions, setSessions] = useState(numOrEmpty(current?.total_sessions));
  const [notes, setNotes] = useState(current?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        await saveMetrics(monthId, planId, {
          total_clicks: clicks ? parseInt(clicks) : null,
          total_impressions: impressions ? parseInt(impressions) : null,
          avg_ctr: ctr ? parseFloat(ctr) : null,
          avg_position: position ? parseFloat(position) : null,
          total_sessions: sessions ? parseInt(sessions) : null,
          notes: notes.trim() || null,
        });
        setSaved(true);
        onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar métricas");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Métricas del mes
        </h3>
        {prev && (
          <p className="text-xs text-gray-400">
            Referencia: valores del mes anterior
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricField
          id="clicks"
          label="Clics totales"
          value={clicks}
          onChange={setClicks}
          hint={prev?.total_clicks != null ? `Anterior: ${prev.total_clicks.toLocaleString()}` : undefined}
          placeholder="0"
        />
        <MetricField
          id="impressions"
          label="Impresiones"
          value={impressions}
          onChange={setImpressions}
          hint={prev?.total_impressions != null ? `Anterior: ${prev.total_impressions.toLocaleString()}` : undefined}
          placeholder="0"
        />
        <MetricField
          id="ctr"
          label="CTR promedio (%)"
          value={ctr}
          onChange={setCtr}
          hint={prev?.avg_ctr != null ? `Anterior: ${prev.avg_ctr}%` : undefined}
          placeholder="0.00"
          step="0.01"
        />
        <MetricField
          id="position"
          label="Posición promedio"
          value={position}
          onChange={setPosition}
          hint={prev?.avg_position != null ? `Anterior: ${prev.avg_position}` : undefined}
          placeholder="0.00"
          step="0.01"
        />
        <MetricField
          id="sessions"
          label="Sesiones totales"
          value={sessions}
          onChange={setSessions}
          hint={prev?.total_sessions != null ? `Anterior: ${prev.total_sessions.toLocaleString()}` : undefined}
          placeholder="0"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="metrics-notes" className="text-xs font-medium text-gray-600">
          Observaciones
        </Label>
        <textarea
          id="metrics-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Tendencias observadas, acciones tomadas, próximos pasos…"
          className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none transition-all"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Métricas guardadas correctamente.
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="bg-brand-500 hover:bg-brand-600 text-white h-9 text-sm"
      >
        {isPending ? "Guardando…" : "Guardar métricas"}
      </Button>
    </form>
  );
}

// ─── MetricField ──────────────────────────────────────────────────────────────

function MetricField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  step,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-medium text-gray-600">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400"
      />
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}
