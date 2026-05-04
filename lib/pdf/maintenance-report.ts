import { marked } from "marked"
import type {
  PageSpeedResult,
  GSCRow,
} from "@/app/(dashboard)/dashboard/maintenance/[planId]/actions"

export type ReportTask = {
  id: string
  title: string
  responsible: string
  estimated_duration: string | null
  notes: string | null
  week_number: number
  internal_only: boolean
  status: { value: string; label: string; color: string | null } | null
}

export type ReportMetrics = {
  total_clicks: number | null
  total_impressions: number | null
  avg_ctr: number | null
  avg_position: number | null
  total_sessions: number | null
  notes: string | null
  pagespeed_url: string | null
  pagespeed_mobile: PageSpeedResult | null
  pagespeed_desktop: PageSpeedResult | null
  gsc_site_url: string | null
  gsc_top_queries: GSCRow[] | null
  gsc_top_pages: GSCRow[] | null
  gsc_top_countries: GSCRow[] | null
  gsc_fetched_at: string | null
} | null

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export const WEEK_LABELS = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]

export type MetricRow = {
  key:
    | "total_clicks"
    | "total_impressions"
    | "avg_ctr"
    | "avg_position"
    | "total_sessions"
  label: string
  decimals: number
  inverted?: boolean
}

export const METRIC_ROWS: MetricRow[] = [
  { key: "total_clicks", label: "Clics totales", decimals: 0 },
  { key: "total_impressions", label: "Impresiones", decimals: 0 },
  { key: "avg_ctr", label: "CTR promedio (%)", decimals: 2 },
  {
    key: "avg_position",
    label: "Posición promedio",
    decimals: 2,
    inverted: true,
  },
  { key: "total_sessions", label: "Sesiones totales", decimals: 0 },
]

export const PS_METRIC_LABELS: Record<string, string> = {
  fcp: "FCP",
  lcp: "LCP",
  tbt: "TBT",
  cls: "CLS",
  si: "SI",
}

export function psMetricColor(score: number): string {
  return score >= 0.9 ? "#16a34a" : score >= 0.5 ? "#d97706" : "#dc2626"
}

export function psScoreColor(score: number): string {
  return score >= 90 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626"
}

export function psScoreLabel(score: number): string {
  return score >= 90
    ? "Excelente"
    : score >= 50
      ? "Por mejorar"
      : "Necesita atención"
}

export function psScoreSummary(score: number, device: string): string {
  if (score >= 90)
    return `El sitio web en ${device} carga de manera óptima para los visitantes.`
  if (score >= 50)
    return `Hay oportunidades de mejora en la velocidad de carga en ${device}.`
  return `Se requieren mejoras de rendimiento en ${device} para una buena experiencia.`
}

export const METRIC_DESCRIPTIONS: Record<
  string,
  { label: string; description: string }
> = {
  fcp: {
    label: "Primera carga visual",
    description: "Tiempo hasta que aparece el primer contenido en pantalla",
  },
  lcp: {
    label: "Carga del elemento principal",
    description:
      "Cuánto tarda en cargar el contenido más importante de la página",
  },
  tbt: {
    label: "Tiempo de bloqueo",
    description:
      "Capacidad de respuesta de la página mientras termina de cargar",
  },
  cls: {
    label: "Estabilidad del diseño",
    description: "Si los elementos se mueven o saltan mientras carga la página",
  },
  si: {
    label: "Índice de velocidad",
    description:
      "Qué tan rápido se muestra visualmente el contenido en pantalla",
  },
}

export const STATUS_MAP: Record<string, { label: string; className: string }> =
  {
    done: { label: "Completada", className: "bg-green-50 text-green-700" },
    in_progress: {
      label: "En progreso",
      className: "bg-amber-50 text-amber-700",
    },
    pending: { label: "Pendiente", className: "bg-gray-100 text-gray-500" },
    skipped: { label: "Omitida", className: "bg-red-50 text-red-600" },
  }

const COUNTRY_NAMES: Record<string, string> = {
  mex: "México",
  usa: "Estados Unidos",
  esp: "España",
  col: "Colombia",
  arg: "Argentina",
  chl: "Chile",
  per: "Perú",
  bra: "Brasil",
  can: "Canadá",
  gbr: "Reino Unido",
  fra: "Francia",
  deu: "Alemania",
  ita: "Italia",
  aus: "Australia",
  prt: "Portugal",
  cri: "Costa Rica",
  pan: "Panamá",
  dom: "Rep. Dominicana",
  ecu: "Ecuador",
  bol: "Bolivia",
  pry: "Paraguay",
  ury: "Uruguay",
  ven: "Venezuela",
  gtm: "Guatemala",
  hnd: "Honduras",
  slv: "El Salvador",
  nic: "Nicaragua",
  phl: "Filipinas",
  kor: "Corea del Sur",
  jpn: "Japón",
  ind: "India",
  nld: "Países Bajos",
  bel: "Bélgica",
  che: "Suiza",
  pol: "Polonia",
  tur: "Turquía",
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code.toLowerCase()] ?? code.toUpperCase()
}

export function formatPageUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname === "/" ? "(Inicio)" : u.pathname
    return path.length > 55 ? path.slice(0, 52) + "…" : path
  } catch {
    return url.length > 55 ? url.slice(0, 52) + "…" : url
  }
}

export function fmt(val: number | null | undefined, decimals = 0): string {
  if (val == null) return "—"
  return val.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function pctChange(
  curr: number | null,
  prev: number | null
): number | null {
  if (curr == null || prev == null || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

export function getMetricVal(
  metrics: ReportMetrics,
  key: string
): number | null {
  if (!metrics) return null
  return (metrics as Record<string, number | null>)[key] ?? null
}

export type MaintenanceReportData = {
  clientName: string
  month: number
  year: number
  monthNumber: number
  tasks: ReportTask[]
  metrics: ReportMetrics
  prevMetrics: ReportMetrics
}

export function buildMaintenanceReportHTML(
  data: MaintenanceReportData
): string {
  const { clientName, month, year, tasks, metrics, prevMetrics } = data
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  const clientTasks = tasks.filter((t) => !t.internal_only)
  const tasksByWeek = new Map<number, ReportTask[]>()
  for (let w = 1; w <= 4; w++) tasksByWeek.set(w, [])
  for (const t of clientTasks) tasksByWeek.get(t.week_number)?.push(t)

  const statusColors: Record<string, { bg: string; color: string }> = {
    done: { bg: "#f0fdf4", color: "#15803d" },
    in_progress: { bg: "#fffbeb", color: "#b45309" },
    pending: { bg: "#f3f4f6", color: "#6b7280" },
    skipped: { bg: "#fef2f2", color: "#dc2626" },
  }

  function badge(value: string | undefined): string {
    const s = (value ? statusColors[value] : null) ?? statusColors.pending
    const label = (value ? STATUS_MAP[value]?.label : null) ?? "Pendiente"
    return `<span style="background:${s.bg};color:${s.color};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">${label}</span>`
  }

  function fmtVal(val: number | null | undefined, decimals = 0) {
    if (val == null) return "—"
    return val.toLocaleString("es-MX", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  function pctHtml(
    curr: number | null,
    prev: number | null,
    inverted = false
  ): string {
    if (curr == null || prev == null || prev === 0)
      return `<span style="color:#9ca3af">—</span>`
    const pct = ((curr - prev) / prev) * 100
    const isGood = inverted ? pct < 0 : pct > 0
    const neutral = Math.abs(pct) < 0.1
    const color = neutral ? "#9ca3af" : isGood ? "#16a34a" : "#ef4444"
    return `<span style="color:${color};font-weight:700">${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%</span>`
  }

  function thStyle(align = "left") {
    return `style="text-align:${align};padding:8px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;background:#f9fafb;border-bottom:1px solid #f3f4f6"`
  }

  function tdStyle(align = "left", extra = "") {
    return `style="text-align:${align};padding:8px 12px;font-size:11px;${extra}"`
  }

  function scoreRingSvg(score: number, size = 72): string {
    const color = psScoreColor(score)
    return `<svg viewBox="0 0 36 36" width="${size}" height="${size}" style="display:block;flex-shrink:0">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" stroke-width="3" pathLength="100"/>
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="${color}" stroke-width="3" pathLength="100"
        stroke-dasharray="${score} ${100 - score}" stroke-linecap="round" transform="rotate(-90 18 18)"/>
      <text x="18" y="21" text-anchor="middle" font-size="9.5" font-weight="800" fill="${color}">${score}</text>
    </svg>`
  }

  let tasksHtml = ""
  for (let w = 1; w <= 4; w++) {
    const wt = (tasksByWeek.get(w) ?? []).filter((t) => t.status?.value !== "skipped")
    if (!wt.length) continue
    tasksHtml += `
      <div style="margin-bottom:16px;page-break-inside:avoid">
        <p style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${WEEK_LABELS[w - 1]}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead><tr>
            <th ${thStyle()} style="${thStyle().slice(7, -1)};width:60%">Tarea</th>
            <th ${thStyle()}>Duración</th>
            <th ${thStyle()}>Estado</th>
          </tr></thead>
          <tbody>
            ${wt
              .map(
                (t, i) => `
              <tr style="border-bottom:${i < wt.length - 1 ? "1px solid #f3f4f6" : "none"}">
                <td ${tdStyle("left", "color:#374151")}>${t.title}</td>
                <td ${tdStyle("left", "color:#9ca3af")}>${t.estimated_duration ?? "—"}</td>
                <td ${tdStyle()}>${badge(t.status?.value)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
  }

  const metricsSummaryHtml = metrics
    ? `
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead><tr>
        <th ${thStyle()}>Métrica</th>
        <th ${thStyle("right")}>Mes anterior</th>
        <th ${thStyle("right")}>Este mes</th>
      </tr></thead>
      <tbody>
        ${METRIC_ROWS.map(
          (r, i) => `
          <tr style="border-bottom:${i < METRIC_ROWS.length - 1 ? "1px solid #f3f4f6" : "none"}">
            <td ${tdStyle("left", "font-weight:500;color:#4b5563")}>${r.label}</td>
            <td ${tdStyle("right", "color:#9ca3af")}>${fmtVal(getMetricVal(prevMetrics, r.key), r.decimals)}</td>
            <td ${tdStyle("right", "font-weight:700;color:#111827")}>${fmtVal(getMetricVal(metrics, r.key), r.decimals)}</td>
          </tr>`
        ).join("")}
      </tbody>
    </table>
  `
    : `<p style="font-size:12px;color:#9ca3af;font-style:italic">No se han ingresado métricas para este mes.</p>`

  const comparisonHtml =
    metrics && prevMetrics
      ? `
    <div style="page-break-inside:avoid;margin-bottom:28px">
      <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Comparación con mes anterior</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead><tr>
          <th ${thStyle()}>Métrica</th>
          <th ${thStyle("right")}>Anterior</th>
          <th ${thStyle("right")}>Actual</th>
          <th ${thStyle("right")}>Cambio</th>
        </tr></thead>
        <tbody>
          ${METRIC_ROWS.map(
            (r, i) => `
            <tr style="border-bottom:${i < METRIC_ROWS.length - 1 ? "1px solid #f3f4f6" : "none"}">
              <td ${tdStyle("left", "font-weight:500;color:#4b5563")}>${r.label}</td>
              <td ${tdStyle("right", "color:#9ca3af")}>${fmtVal(getMetricVal(prevMetrics, r.key), r.decimals)}</td>
              <td ${tdStyle("right", "font-weight:700;color:#111827")}>${fmtVal(getMetricVal(metrics, r.key), r.decimals)}</td>
              <td ${tdStyle("right")}>${pctHtml(getMetricVal(metrics, r.key), getMetricVal(prevMetrics, r.key), r.inverted)}</td>
            </tr>`
          ).join("")}
        </tbody>
      </table>
    </div>
  `
      : ""

  function deviceCardHtml(
    result: PageSpeedResult,
    device: "Móvil" | "Escritorio"
  ): string {
    const color = psScoreColor(result.score)
    const label = psScoreLabel(result.score)
    const summary = psScoreSummary(result.score, device.toLowerCase())
    const icon = device === "Móvil" ? "📱" : "💻"
    const url = metrics?.pagespeed_url ?? ""
    const date = new Date(result.fetchedAt).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const metricRows = (["fcp", "lcp", "tbt", "cls", "si"] as const)
      .map((key, i) => {
        const m = result.metrics[key]
        const mc = psMetricColor(m.score)
        const status =
          m.score >= 0.9
            ? "Bueno"
            : m.score >= 0.5
              ? "Por mejorar"
              : "Deficiente"
        const desc = METRIC_DESCRIPTIONS[key]
        return `
        <tr style="border-top:${i > 0 ? "1px solid #f3f4f6" : "none"}">
          <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#374151;width:28%">${desc.label}</td>
          <td style="padding:8px 12px;font-size:10px;color:#9ca3af">${desc.description}</td>
          <td style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:${mc};width:14%">${m.displayValue}</td>
          <td style="padding:8px 12px;text-align:right;width:14%">
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:${mc}">
              <span style="width:6px;height:6px;border-radius:50%;background:${mc};display:inline-block;flex-shrink:0"></span>
              ${status}
            </span>
          </td>
        </tr>`
      })
      .join("")

    return `
      <div style="page-break-inside:avoid;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
        <div style="background:#f9fafb;padding:10px 16px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:10px">
          <span style="font-size:18px">${icon}</span>
          <div style="flex:1">
            <p style="font-size:12px;font-weight:700;color:#374151">Rendimiento en ${device}</p>
            <p style="font-size:10px;color:#9ca3af">${url}${url ? " · " : ""}${date}</p>
          </div>
        </div>
        <div style="padding:14px 16px;display:flex;align-items:center;gap:16px;border-bottom:1px solid #f3f4f6">
          ${scoreRingSvg(result.score, 68)}
          <div>
            <p style="font-size:18px;font-weight:800;color:${color};margin-bottom:2px">${label}</p>
            <p style="font-size:11px;color:#6b7280">${summary}</p>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#fafafa;border-bottom:2px solid #f3f4f6">
              <th style="text-align:left;padding:7px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Indicador</th>
              <th style="text-align:left;padding:7px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Qué mide</th>
              <th style="text-align:right;padding:7px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Valor</th>
              <th style="text-align:right;padding:7px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Estado</th>
            </tr>
          </thead>
          <tbody>${metricRows}</tbody>
        </table>
        <p style="font-size:9px;color:#d1d5db;text-align:right;padding:6px 12px;border-top:1px solid #f9fafb">Datos provistos por la API de Google</p>
      </div>`
  }

  function gscSectionHtml(
    title: string,
    description: string,
    head: string[],
    bodyRows: string
  ): string {
    const cols = head
      .map(
        (h, i) =>
          `<th style="text-align:${i === 0 ? "left" : "right"};padding:7px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;background:#f9fafb;border-bottom:1px solid #f3f4f6">${h}</th>`
      )
      .join("")
    return `
      <div style="page-break-inside:avoid;margin-bottom:24px">
        <h2 style="font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px">${title}</h2>
        <p style="font-size:10px;color:#9ca3af;margin-bottom:10px">${description}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead><tr>${cols}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <p style="font-size:9px;color:#d1d5db;text-align:right;margin-top:6px">Datos provistos por la API de Google · Search Console</p>
      </div>`
  }

  function gscTd(val: string, align = "left", extra = "") {
    return `<td style="text-align:${align};padding:7px 12px;font-size:11px;color:#374151;border-top:1px solid #f3f4f6;${extra}">${val}</td>`
  }

  const gscFetchDate = metrics?.gsc_fetched_at
    ? new Date(metrics.gsc_fetched_at).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
      })
    : monthLabel

  const psMobileHtml = metrics?.pagespeed_mobile
    ? deviceCardHtml(metrics.pagespeed_mobile, "Móvil")
    : ""
  const psDesktopHtml = metrics?.pagespeed_desktop
    ? deviceCardHtml(metrics.pagespeed_desktop, "Escritorio")
    : ""

  const gscQueriesHtml = metrics?.gsc_top_queries?.length
    ? gscSectionHtml(
        "Búsquedas principales en Google",
        `Consultas que más tráfico generaron para el sitio durante ${gscFetchDate}`,
        ["Búsqueda", "Clics", "Impresiones", "CTR", "Posición promedio"],
        metrics.gsc_top_queries
          .map(
            (r) => `<tr>
      ${gscTd(r.key)}
      ${gscTd(r.clicks.toLocaleString("es-MX"), "right", "font-weight:600")}
      ${gscTd(r.impressions.toLocaleString("es-MX"), "right", "color:#6b7280")}
      ${gscTd((r.ctr * 100).toFixed(1) + "%", "right", "color:#6b7280")}
      ${gscTd(r.position.toFixed(1), "right", "color:#6b7280")}
    </tr>`
          )
          .join("")
      )
    : ""

  const gscPagesHtml = metrics?.gsc_top_pages?.length
    ? gscSectionHtml(
        "Páginas más visitadas",
        `Páginas que recibieron más clics desde Google durante ${gscFetchDate}`,
        ["Página", "Clics", "Impresiones", "CTR", "Posición promedio"],
        metrics.gsc_top_pages
          .map(
            (r) => `<tr>
      ${gscTd(`<span style="color:#4b5563;font-family:monospace;font-size:10px">${formatPageUrl(r.key)}</span>`)}
      ${gscTd(r.clicks.toLocaleString("es-MX"), "right", "font-weight:600")}
      ${gscTd(r.impressions.toLocaleString("es-MX"), "right", "color:#6b7280")}
      ${gscTd((r.ctr * 100).toFixed(1) + "%", "right", "color:#6b7280")}
      ${gscTd(r.position.toFixed(1), "right", "color:#6b7280")}
    </tr>`
          )
          .join("")
      )
    : ""

  const gscCountriesHtml = metrics?.gsc_top_countries?.length
    ? gscSectionHtml(
        "Países de origen del tráfico",
        `Países desde donde más personas encontraron el sitio durante ${gscFetchDate}`,
        ["País", "Clics", "Impresiones", "CTR"],
        metrics.gsc_top_countries
          .map(
            (r) => `<tr>
      ${gscTd(countryName(r.key))}
      ${gscTd(r.clicks.toLocaleString("es-MX"), "right", "font-weight:600")}
      ${gscTd(r.impressions.toLocaleString("es-MX"), "right", "color:#6b7280")}
      ${gscTd((r.ctr * 100).toFixed(1) + "%", "right", "color:#6b7280")}
    </tr>`
          )
          .join("")
      )
    : ""

  const notesHtml = metrics?.notes
    ? `
    <div style="page-break-inside:avoid;margin-bottom:28px">
      <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Observaciones y próximos pasos</h2>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px">
        <div class="md" style="font-size:12px;color:#374151;line-height:1.7">${marked.parse(metrics.notes, { async: false })}</div>
      </div>
    </div>
  `
    : ""

  const pagespeedSectionHtml =
    psMobileHtml || psDesktopHtml
      ? `
    <div style="margin-bottom:28px">
      <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px">Velocidad del sitio web</h2>
      ${psMobileHtml}
      ${psDesktopHtml}
    </div>
  `
      : ""

  const gscSectionWrapper =
    gscQueriesHtml || gscPagesHtml || gscCountriesHtml
      ? `
    <div style="margin-bottom:28px">
      <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px">Presencia en Google</h2>
      ${gscQueriesHtml}
      ${gscPagesHtml}
      ${gscCountriesHtml}
    </div>
  `
      : ""

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte — ${clientName} — ${monthLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #111827; background: #fff; }
    @page { size: A4; margin: 18mm 14mm; }
    @media print { body { padding: 0; } }
    .md h1,.md h2,.md h3,.md h4 { font-weight:700; color:#111827; margin:1em 0 0.4em; line-height:1.3; }
    .md h1 { font-size:16px; } .md h2 { font-size:14px; } .md h3,.md h4 { font-size:12px; }
    .md p { margin:0.5em 0; }
    .md ul,.md ol { padding-left:1.4em; margin:0.5em 0; }
    .md li { margin:0.2em 0; }
    .md ul { list-style-type:disc; } .md ol { list-style-type:decimal; }
    .md strong { font-weight:700; } .md em { font-style:italic; }
    .md code { font-family:monospace; font-size:10px; background:#f3f4f6; padding:1px 4px; border-radius:3px; }
    .md pre { background:#f3f4f6; border-radius:6px; padding:10px 14px; margin:0.6em 0; overflow:auto; }
    .md pre code { background:transparent; padding:0; }
    .md blockquote { border-left:3px solid #c7d6ff; margin:0.6em 0; padding:0.2em 10px; color:#6b7280; }
    .md hr { border:none; border-top:1px solid #e5e7eb; margin:0.8em 0; }
    .md a { color:#1f49e0; }
    .md table { width:100%; border-collapse:collapse; font-size:11px; margin:0.6em 0; }
    .md th { text-align:left; font-weight:600; background:#f9fafb; padding:6px 10px; border:1px solid #e5e7eb; }
    .md td { padding:6px 10px; border:1px solid #e5e7eb; }
  </style>
</head>
<body>
    <div style="background-color:#1f49e0;padding:60px;display:flex;flex-direction:column;justify-content:space-between;height:100vh">
      <img src="https://storage.googleapis.com/dw-agency/website/white-icon.svg" alt="Logo de DevWorks Studio | Reporte Mensual" style="width:70px;height:70px">
      <div>
        <h1 style="font-size:48px;font-weight:700;color:#fff;letter-spacing:-0.02em">Reporte Mensual</h1>
        <p style="font-size:16px;color:#fff;margin-top:18px;font-weight:medium">${clientName} | ${monthLabel}</p>
      </div>
    </div>

  <div style="page-break-inside:avoid;margin-bottom:28px">
    <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Resumen de métricas</h2>
    ${metricsSummaryHtml}
  </div>

  <div style="page-break-inside:avoid;margin-bottom:28px">
    <h2 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Trabajo realizado</h2>
    ${tasksHtml || `<p style="font-size:12px;color:#9ca3af;font-style:italic">Sin tareas registradas.</p>`}
  </div>

  ${comparisonHtml}
  ${pagespeedSectionHtml}
  ${gscSectionWrapper}
  ${notesHtml}

  <div style="background:#f0f4ff;border:1px solid #c7d6ff;border-radius:10px;padding:20px 24px;margin-bottom:28px;text-align:center;page-break-inside:avoid">
    <p style="font-size:13px;font-weight:700;color:#1f49e0;margin-bottom:6px">¿Tienes preguntas sobre este reporte?</p>
    <p style="font-size:12px;color:#4b5563;line-height:1.6;margin-bottom:12px">Estamos aquí para ayudarte. Si algo no está claro o quieres profundizar en algún punto, no dudes en contactarnos.</p>
    <p style="font-size:12px;font-weight:600;color:#1f49e0">contacto@devworks.studio</p>
  </div>

  <div style="border-top:1px solid #f3f4f6;padding-top:16px;margin-top:8px;text-align:center">
    <p style="font-size:10px;color:#9ca3af">Reporte generado por DevWorks Studio · ${monthLabel}</p>
  </div>
</body>
</html>`
}

export function printDocument(html: string): void {
  const iframe = document.createElement("iframe")
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;"
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(html)
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 1500)
  }, 350)
}
