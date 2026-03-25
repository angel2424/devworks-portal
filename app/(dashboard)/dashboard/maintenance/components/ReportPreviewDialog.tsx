"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ReportTask = {
  id: string;
  title: string;
  responsible: string;
  estimated_duration: string | null;
  notes: string | null;
  week_number: number;
  status: { value: string; label: string; color: string } | null;
};

export type ReportMetrics = {
  total_clicks: number | null;
  total_impressions: number | null;
  avg_ctr: number | null;
  avg_position: number | null;
  total_sessions: number | null;
  notes: string | null;
} | null;

interface Props {
  open: boolean;
  onClose: () => void;
  clientName: string;
  month: number;
  year: number;
  monthNumber: number;
  tasks: ReportTask[];
  metrics: ReportMetrics;
  prevMetrics: ReportMetrics;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEK_LABELS = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];

type MetricRow = {
  key: "total_clicks" | "total_impressions" | "avg_ctr" | "avg_position" | "total_sessions";
  label: string;
  decimals: number;
  inverted?: boolean;
};

const METRIC_ROWS: MetricRow[] = [
  { key: "total_clicks",      label: "Clics totales",      decimals: 0 },
  { key: "total_impressions", label: "Impresiones",         decimals: 0 },
  { key: "avg_ctr",           label: "CTR promedio (%)",    decimals: 2 },
  { key: "avg_position",      label: "Posición promedio",   decimals: 2, inverted: true },
  { key: "total_sessions",    label: "Sesiones totales",    decimals: 0 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined, decimals = 0): string {
  if (val == null) return "—";
  return val.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pctChange(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function getMetricVal(metrics: ReportMetrics, key: string): number | null {
  if (!metrics) return null;
  return (metrics as Record<string, number | null>)[key] ?? null;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  done:        { label: "Completada",  className: "bg-green-50 text-green-700" },
  in_progress: { label: "En progreso", className: "bg-amber-50 text-amber-700" },
  pending:     { label: "Pendiente",   className: "bg-gray-100 text-gray-500" },
  skipped:     { label: "Omitida",     className: "bg-red-50 text-red-600" },
};

function StatusBadge({ value }: { value: string | undefined }) {
  const s = (value ? STATUS_MAP[value] : null) ?? STATUS_MAP.pending;
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", s.className)}>
      {s.label}
    </span>
  );
}

// ─── Print via iframe ──────────────────────────────────────────────────────────

function buildPrintHTML(props: Omit<Props, "open" | "onClose">): string {
  const { clientName, month, year, monthNumber, tasks, metrics, prevMetrics } = props;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const tasksByWeek = new Map<number, ReportTask[]>();
  for (let w = 1; w <= 4; w++) tasksByWeek.set(w, []);
  for (const t of tasks) tasksByWeek.get(t.week_number)?.push(t);

  const statusColors: Record<string, { bg: string; color: string }> = {
    done:        { bg: "#f0fdf4", color: "#15803d" },
    in_progress: { bg: "#fffbeb", color: "#b45309" },
    pending:     { bg: "#f3f4f6", color: "#6b7280" },
    skipped:     { bg: "#fef2f2", color: "#dc2626" },
  };

  function badge(value: string | undefined): string {
    const s = (value && statusColors[value]) ?? statusColors.pending;
    const label = (value && STATUS_MAP[value]?.label) ?? "Pendiente";
    return `<span style="background:${s.bg};color:${s.color};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">${label}</span>`;
  }

  function fmtVal(val: number | null | undefined, decimals = 0) {
    if (val == null) return "—";
    return val.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function pctHtml(curr: number | null, prev: number | null, inverted = false): string {
    if (curr == null || prev == null || prev === 0) return `<span style="color:#9ca3af">—</span>`;
    const pct = ((curr - prev) / prev) * 100;
    const isGood = inverted ? pct < 0 : pct > 0;
    const neutral = Math.abs(pct) < 0.1;
    const color = neutral ? "#9ca3af" : isGood ? "#16a34a" : "#ef4444";
    return `<span style="color:${color};font-weight:700">${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%</span>`;
  }

  function thStyle(align = "left") {
    return `style="text-align:${align};padding:8px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;background:#f9fafb;border-bottom:1px solid #f3f4f6"`;
  }

  function tdStyle(align = "left", extra = "") {
    return `style="text-align:${align};padding:8px 12px;font-size:11px;${extra}"`;
  }

  // Tasks section
  let tasksHtml = "";
  for (let w = 1; w <= 4; w++) {
    const wt = tasksByWeek.get(w) ?? [];
    if (!wt.length) continue;
    tasksHtml += `
      <div style="margin-bottom:16px;page-break-inside:avoid">
        <p style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${WEEK_LABELS[w - 1]}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead>
            <tr>
              <th ${thStyle()} style="${thStyle().slice(7, -1)};width:40%">Tarea</th>
              <th ${thStyle()}>Responsable</th>
              <th ${thStyle()}>Duración</th>
              <th ${thStyle()}>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${wt.map((t, i) => `
              <tr style="border-bottom:${i < wt.length - 1 ? "1px solid #f3f4f6" : "none"}">
                <td ${tdStyle("left", "color:#374151")}>${t.title}</td>
                <td ${tdStyle("left", "color:#6b7280")}>${t.responsible}</td>
                <td ${tdStyle("left", "color:#9ca3af")}>${t.estimated_duration ?? "—"}</td>
                <td ${tdStyle()}>${badge(t.status?.value)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // Metrics summary
  const metricsSummaryHtml = metrics ? `
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead>
        <tr>
          <th ${thStyle()}>Métrica</th>
          <th ${thStyle("right")}>Mes anterior</th>
          <th ${thStyle("right")}>Este mes</th>
        </tr>
      </thead>
      <tbody>
        ${METRIC_ROWS.map((r, i) => `
          <tr style="border-bottom:${i < METRIC_ROWS.length - 1 ? "1px solid #f3f4f6" : "none"}">
            <td ${tdStyle("left", "font-weight:500;color:#4b5563")}>${r.label}</td>
            <td ${tdStyle("right", "color:#9ca3af")}>${fmtVal(getMetricVal(prevMetrics, r.key), r.decimals)}</td>
            <td ${tdStyle("right", "font-weight:700;color:#111827")}>${fmtVal(getMetricVal(metrics, r.key), r.decimals)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : `<p style="font-size:12px;color:#9ca3af;font-style:italic">No se han ingresado métricas para este mes.</p>`;

  // Comparison
  const comparisonHtml = (metrics && prevMetrics) ? `
    <div style="page-break-inside:avoid;margin-bottom:28px">
      <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Comparación con mes anterior</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr>
            <th ${thStyle()}>Métrica</th>
            <th ${thStyle("right")}>Anterior</th>
            <th ${thStyle("right")}>Actual</th>
            <th ${thStyle("right")}>Cambio</th>
          </tr>
        </thead>
        <tbody>
          ${METRIC_ROWS.map((r, i) => `
            <tr style="border-bottom:${i < METRIC_ROWS.length - 1 ? "1px solid #f3f4f6" : "none"}">
              <td ${tdStyle("left", "font-weight:500;color:#4b5563")}>${r.label}</td>
              <td ${tdStyle("right", "color:#9ca3af")}>${fmtVal(getMetricVal(prevMetrics, r.key), r.decimals)}</td>
              <td ${tdStyle("right", "font-weight:700;color:#111827")}>${fmtVal(getMetricVal(metrics, r.key), r.decimals)}</td>
              <td ${tdStyle("right")}>${pctHtml(getMetricVal(metrics, r.key), getMetricVal(prevMetrics, r.key), r.inverted)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : "";

  const notesHtml = metrics?.notes ? `
    <div style="page-break-inside:avoid;margin-bottom:28px">
      <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Observaciones y próximos pasos</h2>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px">
        <p style="font-size:12px;color:#374151;line-height:1.65;white-space:pre-wrap;margin:0">${metrics.notes}</p>
      </div>
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte — ${clientName} — ${monthLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #111827; background: #fff; padding: 40px 48px; }
    @page { size: A4; margin: 18mm 14mm; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="text-align:center;margin-bottom:36px;padding-bottom:28px;border-bottom:2px solid #f3f4f6">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px">DevWorks Studio</p>
    <h1 style="font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;margin-bottom:6px">Reporte Mensual — ${monthLabel}</h1>
    <p style="font-size:14px;color:#6b7280;margin-bottom:2px">${clientName}</p>
    <p style="font-size:11px;color:#9ca3af">Mes ${monthNumber}</p>
  </div>

  <!-- Metrics summary -->
  <div style="page-break-inside:avoid;margin-bottom:28px">
    <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Resumen de métricas</h2>
    ${metricsSummaryHtml}
  </div>

  <!-- Tasks -->
  <div style="page-break-inside:avoid;margin-bottom:28px">
    <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Trabajo realizado</h2>
    ${tasksHtml || `<p style="font-size:12px;color:#9ca3af;font-style:italic">Sin tareas registradas.</p>`}
  </div>

  ${comparisonHtml}
  ${notesHtml}

  <!-- Footer -->
  <div style="border-top:1px solid #f3f4f6;padding-top:16px;margin-top:8px;text-align:center">
    <p style="font-size:10px;color:#9ca3af">Reporte generado por DevWorks Studio · ${monthLabel}</p>
  </div>
</body>
</html>`;
}

function printReport(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 350);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ReportPreviewDialog({
  open,
  onClose,
  clientName,
  month,
  year,
  monthNumber,
  tasks,
  metrics,
  prevMetrics,
}: Props) {
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const tasksByWeek = new Map<number, ReportTask[]>();
  for (let w = 1; w <= 4; w++) tasksByWeek.set(w, []);
  for (const t of tasks) tasksByWeek.get(t.week_number)?.push(t);

  function handlePrint() {
    const html = buildPrintHTML({ clientName, month, year, monthNumber, tasks, metrics, prevMetrics });
    printReport(html);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0 bg-white">
          <div>
            <p className="text-sm font-semibold text-gray-800">Vista previa — Reporte mensual</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {clientName} · {monthLabel} · Mes {monthNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Guardar como PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Report body */}
        <div className="overflow-y-auto flex-1 bg-gray-50/40">
          <div className="px-8 py-7 max-w-[680px] mx-auto space-y-8">

            {/* Report header */}
            <div className="text-center space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                DevWorks Studio
              </p>
              <h1 className="font-heading text-2xl text-gray-900 tracking-tight">
                Reporte Mensual — {monthLabel}
              </h1>
              <p className="text-sm text-gray-500">{clientName}</p>
              <p className="text-xs text-gray-400">Mes {monthNumber}</p>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Metrics summary */}
            <section>
              <SectionHeading>Resumen de métricas</SectionHeading>
              {metrics ? (
                <ReportTable
                  head={["Métrica", "Mes anterior", "Este mes"]}
                  alignRight={[1, 2]}
                  rows={METRIC_ROWS.map((r) => [
                    r.label,
                    fmt(getMetricVal(prevMetrics, r.key), r.decimals),
                    <span key={r.key} className="font-semibold text-gray-800">
                      {fmt(getMetricVal(metrics, r.key), r.decimals)}
                    </span>,
                  ])}
                />
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No se han ingresado métricas para este mes.
                </p>
              )}
            </section>

            {/* Tasks */}
            <section>
              <SectionHeading>Trabajo realizado</SectionHeading>
              <div className="space-y-4">
                {Array.from({ length: 4 }, (_, i) => i + 1).map((week) => {
                  const wt = tasksByWeek.get(week) ?? [];
                  if (!wt.length) return null;
                  return (
                    <div key={week}>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {WEEK_LABELS[week - 1]}
                      </p>
                      <ReportTable
                        head={["Tarea", "Responsable", "Duración", "Estado"]}
                        rows={wt.map((t) => [
                          t.title,
                          <span key={t.id + "r"} className="text-gray-500">{t.responsible}</span>,
                          <span key={t.id + "d"} className="text-gray-400">{t.estimated_duration ?? "—"}</span>,
                          <StatusBadge key={t.id + "s"} value={t.status?.value} />,
                        ])}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Comparison */}
            {metrics && prevMetrics && (
              <section>
                <SectionHeading>Comparación con mes anterior</SectionHeading>
                <ReportTable
                  head={["Métrica", "Anterior", "Actual", "Cambio"]}
                  alignRight={[1, 2, 3]}
                  rows={METRIC_ROWS.map((r) => {
                    const curr = getMetricVal(metrics, r.key);
                    const prev = getMetricVal(prevMetrics, r.key);
                    const pct = pctChange(curr, prev);
                    const isGood = r.inverted ? (pct ?? 0) < 0 : (pct ?? 0) > 0;
                    const neutral = pct != null && Math.abs(pct) < 0.1;
                    return [
                      r.label,
                      <span key={r.key + "p"} className="text-gray-400">{fmt(prev, r.decimals)}</span>,
                      <span key={r.key + "c"} className="font-semibold text-gray-800">{fmt(curr, r.decimals)}</span>,
                      pct != null ? (
                        <span
                          key={r.key + "d"}
                          className={cn(
                            "font-semibold",
                            neutral ? "text-gray-400" : isGood ? "text-green-600" : "text-red-500"
                          )}
                        >
                          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span key={r.key + "d"} className="text-gray-400">—</span>
                      ),
                    ];
                  })}
                />
              </section>
            )}

            {/* Notes */}
            {metrics?.notes && (
              <section>
                <SectionHeading>Observaciones y próximos pasos</SectionHeading>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {metrics.notes}
                  </p>
                </div>
              </section>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-5 text-center">
              <p className="text-[11px] text-gray-400">
                Reporte generado por DevWorks Studio · {monthLabel}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3">
      {children}
    </p>
  );
}

function ReportTable({
  head,
  rows,
  alignRight = [],
}: {
  head: string[];
  rows: (React.ReactNode | string)[][];
  alignRight?: number[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {head.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400",
                  alignRight.includes(i) ? "text-right" : "text-left"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-100 last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-4 py-2.5 text-xs text-gray-600",
                    alignRight.includes(ci) ? "text-right" : "text-left"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
