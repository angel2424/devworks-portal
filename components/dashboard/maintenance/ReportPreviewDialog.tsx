"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Printer, X } from "lucide-react"
import type { PageSpeedResult } from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions"
import {
  type ReportTask,
  type ReportMetrics,
  MONTH_NAMES,
  WEEK_LABELS,
  METRIC_ROWS,
  METRIC_DESCRIPTIONS,
  STATUS_MAP,
  psMetricColor,
  psScoreColor,
  psScoreLabel,
  psScoreSummary,
  countryName,
  formatPageUrl,
  fmt,
  pctChange,
  getMetricVal,
  buildMaintenanceReportHTML,
  printDocument,
} from "@/lib/pdf/maintenance-report"

export type { ReportTask, ReportMetrics }

interface Props {
  open: boolean
  onClose: () => void
  clientName: string
  month: number
  year: number
  monthNumber: number
  tasks: ReportTask[]
  metrics: ReportMetrics
  prevMetrics: ReportMetrics
}

function StatusBadge({ value }: { value: string | undefined }) {
  const s = (value ? STATUS_MAP[value] : null) ?? STATUS_MAP.pending
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
        s.className
      )}
    >
      {s.label}
    </span>
  )
}

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
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  const clientTasks = tasks.filter((t) => !t.internal_only)
  const tasksByWeek = new Map<number, ReportTask[]>()
  for (let w = 1; w <= 4; w++) tasksByWeek.set(w, [])
  for (const t of clientTasks) tasksByWeek.get(t.week_number)?.push(t)

  function handlePrint() {
    printDocument(
      buildMaintenanceReportHTML({
        clientName,
        month,
        year,
        monthNumber,
        tasks,
        metrics,
        prevMetrics,
      })
    )
  }

  const gscFetchDate = metrics?.gsc_fetched_at
    ? new Date(metrics.gsc_fetched_at).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
      })
    : monthLabel

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92dvh] max-w-4xl flex-col gap-0 overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-3.5">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Vista previa — Reporte mensual
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {clientName} · {monthLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-brand-500 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
            >
              <Printer size=".9rem" />
              Guardar como PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X size="1rem" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/40">
          <div className="mx-auto max-w-[720px] space-y-8 px-8 py-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-light tracking-wide text-gray-400 uppercase">
                  {clientName}
                </p>
                <h1 className="font-heading text-primary text-2xl">
                  Reporte Mensual
                </h1>
              </div>
              <p className="text-xs font-medium text-gray-500">
                {monthLabel} | DevWorks Studio
              </p>
            </div>

            <div className="h-px bg-gray-200" />

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

            <section>
              <SectionHeading>Trabajo realizado</SectionHeading>
              <div className="space-y-6">
                {Array.from({ length: 4 }, (_, i) => i + 1).map((week) => {
                  const wt = tasksByWeek.get(week) ?? []
                  if (!wt.length) return null
                  return (
                    <div key={week}>
                      <p className="mb-3 px-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                        {WEEK_LABELS[week - 1]}
                      </p>
                      <ReportTable
                        head={["Tarea", "Duración", "Estado"]}
                        rows={wt.map((t) => [
                          t.title,
                          <span key={t.id + "d"} className="text-gray-400">
                            {t.estimated_duration ?? "—"}
                          </span>,
                          <StatusBadge
                            key={t.id + "s"}
                            value={t.status?.value}
                          />,
                        ])}
                      />
                    </div>
                  )
                })}
              </div>
            </section>

            {metrics && prevMetrics && (
              <section>
                <SectionHeading>Comparación con mes anterior</SectionHeading>
                <ReportTable
                  head={["Métrica", "Anterior", "Actual", "Cambio"]}
                  alignRight={[1, 2, 3]}
                  rows={METRIC_ROWS.map((r) => {
                    const curr = getMetricVal(metrics, r.key)
                    const prev = getMetricVal(prevMetrics, r.key)
                    const pct = pctChange(curr, prev)
                    const isGood = r.inverted ? (pct ?? 0) < 0 : (pct ?? 0) > 0
                    const neutral = pct != null && Math.abs(pct) < 0.1
                    return [
                      r.label,
                      <span key={r.key + "p"} className="text-gray-400">
                        {fmt(prev, r.decimals)}
                      </span>,
                      <span
                        key={r.key + "c"}
                        className="font-semibold text-gray-800"
                      >
                        {fmt(curr, r.decimals)}
                      </span>,
                      pct != null ? (
                        <span
                          key={r.key + "d"}
                          className={cn(
                            "font-semibold",
                            neutral
                              ? "text-gray-400"
                              : isGood
                                ? "text-green-600"
                                : "text-red-500"
                          )}
                        >
                          {pct >= 0 ? "+" : ""}
                          {pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span key={r.key + "d"} className="text-gray-400">
                          —
                        </span>
                      ),
                    ]
                  })}
                />
              </section>
            )}

            {metrics?.pagespeed_mobile && (
              <section>
                <SectionHeading>Velocidad del sitio web</SectionHeading>
                <div className="space-y-4">
                  <PageSpeedDeviceCard
                    result={metrics.pagespeed_mobile}
                    device="Móvil"
                    url={metrics.pagespeed_url ?? undefined}
                  />
                  {metrics.pagespeed_desktop && (
                    <PageSpeedDeviceCard
                      result={metrics.pagespeed_desktop}
                      device="Escritorio"
                      url={metrics.pagespeed_url ?? undefined}
                    />
                  )}
                </div>
              </section>
            )}

            {metrics?.gsc_top_queries?.length ? (
              <section>
                <SectionHeading>Presencia en Google</SectionHeading>
                <p className="-mt-3 mb-5 text-[10px] text-gray-400">
                  {metrics.gsc_site_url && `${metrics.gsc_site_url} · `}
                  {gscFetchDate}
                </p>
                <div className="space-y-6">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-gray-600">
                      Búsquedas principales
                    </p>
                    <p className="mb-3 text-[10px] text-gray-400">
                      Consultas que más tráfico generaron para el sitio
                    </p>
                    <ReportTable
                      head={["Búsqueda", "Clics", "Impresiones", "CTR", "Posición"]}
                      alignRight={[1, 2, 3, 4]}
                      rows={metrics.gsc_top_queries.map((r) => [
                        r.key,
                        <span key="c" className="font-semibold">
                          {r.clicks.toLocaleString("es-MX")}
                        </span>,
                        r.impressions.toLocaleString("es-MX"),
                        (r.ctr * 100).toFixed(1) + "%",
                        r.position.toFixed(1),
                      ])}
                    />
                    <GoogleAttribution />
                  </div>

                  {metrics.gsc_top_pages?.length ? (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-gray-600">
                        Páginas más visitadas
                      </p>
                      <p className="mb-3 text-[10px] text-gray-400">
                        Páginas que recibieron más clics desde los resultados de
                        Google
                      </p>
                      <ReportTable
                        head={["Página", "Clics", "Impresiones", "CTR", "Posición"]}
                        alignRight={[1, 2, 3, 4]}
                        rows={metrics.gsc_top_pages.map((r) => [
                          <span
                            key="u"
                            className="font-mono text-[10px] text-gray-500"
                          >
                            {formatPageUrl(r.key)}
                          </span>,
                          <span key="c" className="font-semibold">
                            {r.clicks.toLocaleString("es-MX")}
                          </span>,
                          r.impressions.toLocaleString("es-MX"),
                          (r.ctr * 100).toFixed(1) + "%",
                          r.position.toFixed(1),
                        ])}
                      />
                      <GoogleAttribution />
                    </div>
                  ) : null}

                  {metrics.gsc_top_countries?.length ? (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-gray-600">
                        Países de origen del tráfico
                      </p>
                      <p className="mb-3 text-[10px] text-gray-400">
                        Países desde donde más personas encontraron el sitio en
                        Google
                      </p>
                      <ReportTable
                        head={["País", "Clics", "Impresiones", "CTR"]}
                        alignRight={[1, 2, 3]}
                        rows={metrics.gsc_top_countries.map((r) => [
                          countryName(r.key),
                          <span key="c" className="font-semibold">
                            {r.clicks.toLocaleString("es-MX")}
                          </span>,
                          r.impressions.toLocaleString("es-MX"),
                          (r.ctr * 100).toFixed(1) + "%",
                        ])}
                      />
                      <GoogleAttribution />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {metrics?.notes && (
              <section>
                <SectionHeading>Observaciones y próximos pasos</SectionHeading>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                    {metrics.notes}
                  </p>
                </div>
              </section>
            )}

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-5 text-center">
              <p className="mb-1 text-sm font-semibold text-blue-700">
                ¿Tienes preguntas sobre este reporte?
              </p>
              <p className="mb-3 text-xs leading-relaxed text-gray-500">
                Estamos aquí para ayudarte. Si algo no está claro o quieres
                profundizar en algún punto, no dudes en contactarnos.
              </p>
              <p className="text-xs font-semibold text-blue-600">
                contacto@devworks.studio
              </p>
            </div>

            <div className="border-t border-gray-200 pt-5 text-center">
              <p className="text-[11px] text-gray-400">
                Reporte generado por DevWorks Studio · {monthLabel}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-brand-400 mb-5 text-xs font-bold tracking-widest uppercase">
      {children}
    </p>
  )
}

function GoogleAttribution() {
  return (
    <p className="mt-2 text-right text-[9px] text-gray-300">
      Datos provistos por la API de Google
    </p>
  )
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = score >= 90 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626"
  return (
    <svg viewBox="0 0 36 36" width={size} height={size} className="shrink-0">
      <circle
        cx="18"
        cy="18"
        r="15.9"
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="3"
        pathLength="100"
      />
      <circle
        cx="18"
        cy="18"
        r="15.9"
        fill="none"
        stroke={color}
        strokeWidth="3"
        pathLength="100"
        strokeDasharray={`${score} ${100 - score}`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="21"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="800"
        fill={color}
      >
        {score}
      </text>
    </svg>
  )
}

function PageSpeedDeviceCard({
  result,
  device,
  url,
}: {
  result: PageSpeedResult
  device: string
  url?: string
}) {
  const color = psScoreColor(result.score)
  const label = psScoreLabel(result.score)
  const summary = psScoreSummary(result.score, device.toLowerCase())
  const icon = device === "Móvil" ? "📱" : "💻"

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-lg leading-none">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-700">
            Rendimiento en {device}
          </p>
          {url && <p className="truncate text-[10px] text-gray-400">{url}</p>}
        </div>
        <p className="shrink-0 text-[10px] text-gray-400">
          {new Date(result.fetchedAt).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-100 px-4 py-4">
        <ScoreRing score={result.score} size={72} />
        <div>
          <p className="text-xl leading-tight font-extrabold" style={{ color }}>
            {label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {summary}
          </p>
        </div>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-2.5 text-left text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Indicador
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Qué mide
            </th>
            <th className="px-4 py-2.5 text-right text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Valor
            </th>
            <th className="px-4 py-2.5 text-right text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {(["fcp", "lcp", "tbt", "cls", "si"] as const).map((key, i) => {
            const m = result.metrics[key]
            const mc = psMetricColor(m.score)
            const status =
              m.score >= 0.9
                ? "Bueno"
                : m.score >= 0.5
                  ? "Por mejorar"
                  : "Deficiente"
            const desc = METRIC_DESCRIPTIONS[key]
            return (
              <tr
                key={key}
                className={cn(
                  "border-b border-gray-100 last:border-0",
                  i % 2 !== 0 ? "bg-gray-50/40" : ""
                )}
              >
                <td className="px-4 py-3 font-semibold text-gray-700">
                  {desc.label}
                </td>
                <td className="px-4 py-3 text-gray-400">{desc.description}</td>
                <td
                  className="px-4 py-3 text-right font-bold"
                  style={{ color: mc }}
                >
                  {m.displayValue}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold"
                    style={{ color: mc }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: mc }}
                    />
                    {status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <GoogleAttribution />
    </div>
  )
}

function ReportTable({
  head,
  rows,
  alignRight = [],
}: {
  head: string[]
  rows: (React.ReactNode | string)[][]
  alignRight?: number[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {head.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-2.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase",
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
  )
}
