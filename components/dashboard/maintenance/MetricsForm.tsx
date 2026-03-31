"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  saveMetrics,
  analyzePageSpeed,
  fetchSearchConsoleData,
  type PageSpeedResult,
  type GSCRow,
} from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions";
import { PS_METRIC_LABELS, psMetricColor } from "./ReportPreviewDialog";
import { Gauge, Loader2, Search } from "lucide-react";

type MetricsData = {
  total_clicks: number | null;
  total_impressions: number | null;
  avg_ctr: number | null;
  avg_position: number | null;
  total_sessions: number | null;
  notes: string | null;
  pagespeed_url: string | null;
  pagespeed_mobile: PageSpeedResult | null;
  pagespeed_desktop: PageSpeedResult | null;
  gsc_site_url: string | null;
  gsc_top_queries: GSCRow[] | null;
  gsc_top_pages: GSCRow[] | null;
  gsc_top_countries: GSCRow[] | null;
  gsc_fetched_at: string | null;
} | null;

interface Props {
  monthId: string;
  planId: string;
  month: number;
  year: number;
  current: MetricsData;
  prev: MetricsData;
  onSaved?: () => void;
}

function numOrEmpty(v: number | null | undefined) {
  return v != null ? String(v) : "";
}

export function MetricsForm({ monthId, planId, month, year, current, prev, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);

  const [clicks,      setClicks]      = useState(numOrEmpty(current?.total_clicks));
  const [impressions, setImpressions] = useState(numOrEmpty(current?.total_impressions));
  const [ctr,         setCtr]         = useState(numOrEmpty(current?.avg_ctr));
  const [position,    setPosition]    = useState(numOrEmpty(current?.avg_position));
  const [sessions,    setSessions]    = useState(numOrEmpty(current?.total_sessions));
  const [notes,       setNotes]       = useState(current?.notes ?? "");

  // ── PageSpeed state ──
  const [psUrl,      setPsUrl]      = useState(current?.pagespeed_url ?? "");
  const [isPsLoading, setIsPsLoading] = useState(false);
  const [psError,    setPsError]    = useState<string | null>(null);
  const [psMobile,   setPsMobile]   = useState<PageSpeedResult | null>(current?.pagespeed_mobile ?? null);
  const [psDesktop,  setPsDesktop]  = useState<PageSpeedResult | null>(current?.pagespeed_desktop ?? null);

  // ── GSC state ──
  const [gscUrl,      setGscUrl]      = useState(current?.gsc_site_url ?? "");
  const [isGscLoading, setIsGscLoading] = useState(false);
  const [gscError,    setGscError]    = useState<string | null>(null);
  const [gscQueries,  setGscQueries]  = useState<GSCRow[] | null>(current?.gsc_top_queries ?? null);
  const [gscPages,    setGscPages]    = useState<GSCRow[] | null>(current?.gsc_top_pages ?? null);
  const [gscCountries,setGscCountries]= useState<GSCRow[] | null>(current?.gsc_top_countries ?? null);
  const [gscFetchedAt,setGscFetchedAt]= useState<string | null>(current?.gsc_fetched_at ?? null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveMetrics(monthId, planId, {
          total_clicks:      clicks      ? parseInt(clicks)       : null,
          total_impressions: impressions ? parseInt(impressions)  : null,
          avg_ctr:           ctr         ? parseFloat(ctr)        : null,
          avg_position:      position    ? parseFloat(position)   : null,
          total_sessions:    sessions    ? parseInt(sessions)     : null,
          notes:             notes.trim() || null,
        });
        setSaved(true);
        onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar métricas");
      }
    });
  }

  async function handleAnalyzePageSpeed() {
    const url = psUrl.trim();
    if (!url) return;
    setIsPsLoading(true);
    setPsError(null);
    try {
      const { mobile, desktop } = await analyzePageSpeed(monthId, planId, url);
      setPsMobile(mobile);
      setPsDesktop(desktop);
    } catch (err) {
      setPsError(err instanceof Error ? err.message : "Error al analizar con PageSpeed");
    } finally {
      setIsPsLoading(false);
    }
  }

  async function handleFetchGSC() {
    const url = gscUrl.trim();
    if (!url) return;
    setIsGscLoading(true);
    setGscError(null);
    try {
      const { queries, pages, countries } = await fetchSearchConsoleData(monthId, planId, url, month, year);
      setGscQueries(queries);
      setGscPages(pages);
      setGscCountries(countries);
      setGscFetchedAt(new Date().toISOString());
    } catch (err) {
      setGscError(err instanceof Error ? err.message : "Error al obtener datos de Search Console");
    } finally {
      setIsGscLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Métricas del mes</h3>
        {prev && <p className="text-xs text-gray-400">Referencia: valores del mes anterior</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricField id="clicks" label="Clics totales" value={clicks} onChange={setClicks}
          hint={prev?.total_clicks != null ? `Anterior: ${prev.total_clicks.toLocaleString()}` : undefined} placeholder="0" />
        <MetricField id="impressions" label="Impresiones" value={impressions} onChange={setImpressions}
          hint={prev?.total_impressions != null ? `Anterior: ${prev.total_impressions.toLocaleString()}` : undefined} placeholder="0" />
        <MetricField id="ctr" label="CTR promedio (%)" value={ctr} onChange={setCtr}
          hint={prev?.avg_ctr != null ? `Anterior: ${prev.avg_ctr}%` : undefined} placeholder="0.00" step="0.01" />
        <MetricField id="position" label="Posición promedio" value={position} onChange={setPosition}
          hint={prev?.avg_position != null ? `Anterior: ${prev.avg_position}` : undefined} placeholder="0.00" step="0.01" />
        <MetricField id="sessions" label="Sesiones totales" value={sessions} onChange={setSessions}
          hint={prev?.total_sessions != null ? `Anterior: ${prev.total_sessions.toLocaleString()}` : undefined} placeholder="0" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="metrics-notes" className="text-xs font-medium text-gray-600">Observaciones</Label>
        <textarea
          id="metrics-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="Tendencias observadas, acciones tomadas, próximos pasos…"
          className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none transition-all"
        />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Métricas guardadas correctamente.</p>}

      <Button type="submit" disabled={isPending} className="bg-brand-500 hover:bg-brand-600 text-white h-9 text-sm">
        {isPending ? "Guardando…" : "Guardar métricas"}
      </Button>

      {/* ──────────────── PageSpeed ──────────────── */}
      <div className="border-t border-gray-200 pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-gray-700">Velocidad del sitio (PageSpeed)</Label>
          {psMobile && (
            <p className="text-[10px] text-gray-400">
              {new Date(psMobile.fetchedAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Input type="url" value={psUrl} onChange={(e) => setPsUrl(e.target.value)}
            placeholder="https://tusitio.com"
            className="h-9 text-sm bg-white border-gray-200 flex-1 focus-visible:ring-brand-500/20 focus-visible:border-brand-400" />
          <Button type="button" onClick={handleAnalyzePageSpeed} disabled={isPsLoading || !psUrl.trim()}
            variant="outline" className="h-9 text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0 gap-1.5">
            {isPsLoading ? <><Loader2 size={13} className="animate-spin" /> Analizando…</> : <><Gauge size={13} /> Analizar</>}
          </Button>
        </div>

        {psError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{psError}</p>}

        {psMobile && psDesktop && (
          <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center gap-4">
            <MiniScoreRing score={psMobile.score}  label="Móvil" />
            <MiniScoreRing score={psDesktop.score} label="Escritorio" />
            <div className="flex-1 min-w-0">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[9px] font-bold uppercase tracking-wider text-gray-400 pb-1.5">Métrica</th>
                    <th className="text-right text-[9px] font-bold uppercase tracking-wider text-gray-400 pb-1.5 pr-2">Móvil</th>
                    <th className="text-right text-[9px] font-bold uppercase tracking-wider text-gray-400 pb-1.5">Escritorio</th>
                  </tr>
                </thead>
                <tbody>
                  {(["fcp","lcp","tbt","cls","si"] as const).map((key, i) => (
                    <tr key={key} className={i > 0 ? "border-t border-gray-100" : ""}>
                      <td className="py-1 text-[10px] text-gray-500 font-medium">{PS_METRIC_LABELS[key]}</td>
                      <td className="py-1 pr-2 text-right text-[10px] font-semibold" style={{ color: psMetricColor(psMobile.metrics[key].score) }}>
                        {psMobile.metrics[key].displayValue}
                      </td>
                      <td className="py-1 text-right text-[10px] font-semibold" style={{ color: psMetricColor(psDesktop.metrics[key].score) }}>
                        {psDesktop.metrics[key].displayValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────── Search Console ──────────────── */}
      <div className="border-t border-gray-200 pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-gray-700">Search Console</Label>
          {gscFetchedAt && (
            <p className="text-[10px] text-gray-400">
              {new Date(gscFetchedAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <p className="text-[10px] text-gray-400 -mt-1">
          Obtiene top búsquedas, páginas y países del mes seleccionado.
          La propiedad debe estar verificada en Search Console con la cuenta de servicio.
        </p>

        <div className="flex gap-2">
          <Input type="url" value={gscUrl} onChange={(e) => setGscUrl(e.target.value)}
            placeholder="https://tusitio.com/"
            className="h-9 text-sm bg-white border-gray-200 flex-1 focus-visible:ring-brand-500/20 focus-visible:border-brand-400" />
          <Button type="button" onClick={handleFetchGSC} disabled={isGscLoading || !gscUrl.trim()}
            variant="outline" className="h-9 text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0 gap-1.5">
            {isGscLoading ? <><Loader2 size={13} className="animate-spin" /> Obteniendo…</> : <><Search size={13} /> Obtener datos</>}
          </Button>
        </div>

        {gscError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{gscError}</p>}

        {gscQueries && (
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            <GSCPreviewTable label="Búsquedas" rows={gscQueries} />
            {gscPages    && <GSCPreviewTable label="Páginas"    rows={gscPages} urlMode />}
            {gscCountries && <GSCPreviewTable label="Países"    rows={gscCountries} countryMode />}
          </div>
        )}
      </div>
    </form>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MiniScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <div className="text-center shrink-0">
      <svg viewBox="0 0 36 36" width={52} height={52}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5" pathLength="100" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3.5" pathLength="100"
          strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="800" fill={color}>{score}</text>
      </svg>
      <p className="text-[9px] text-gray-500 font-semibold mt-0.5">{label}</p>
    </div>
  );
}

function GSCPreviewTable({
  label, rows, urlMode = false, countryMode = false,
}: {
  label: string;
  rows: GSCRow[];
  urlMode?: boolean;
  countryMode?: boolean;
}) {
  function formatKey(key: string) {
    if (urlMode) {
      try { const p = new URL(key).pathname; return p === "/" ? "(Inicio)" : p; } catch { return key; }
    }
    if (countryMode) {
      const map: Record<string, string> = {
        mex: "México", usa: "EE.UU.", esp: "España", col: "Colombia", arg: "Argentina",
        chl: "Chile", per: "Perú", bra: "Brasil", can: "Canadá", gbr: "R. Unido",
      };
      return map[key.toLowerCase()] ?? key.toUpperCase();
    }
    return key;
  }

  return (
    <div>
      <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <table className="w-full">
        <tbody>
          {rows.slice(0, 5).map((r, i) => (
            <tr key={i} className="border-t border-gray-100 first:border-0">
              <td className="px-3 py-1.5 text-[10px] text-gray-600 truncate max-w-[160px]">{formatKey(r.key)}</td>
              <td className="px-3 py-1.5 text-[10px] text-gray-400 text-right whitespace-nowrap">
                <span className="text-gray-700 font-semibold">{r.clicks}</span> clics
              </td>
              <td className="px-3 py-1.5 text-[10px] text-gray-400 text-right whitespace-nowrap">
                pos. {r.position.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 5 && (
        <p className="px-3 pb-2 text-[9px] text-gray-400">+{rows.length - 5} más en el reporte</p>
      )}
    </div>
  );
}

function MetricField({
  id, label, value, onChange, hint, placeholder, step,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  hint?: string; placeholder?: string; step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-medium text-gray-600">{label}</Label>
      <Input id={id} type="number" min="0" step={step} value={value}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-9 text-sm bg-white border-gray-200 focus-visible:ring-brand-500/20 focus-visible:border-brand-400" />
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}
