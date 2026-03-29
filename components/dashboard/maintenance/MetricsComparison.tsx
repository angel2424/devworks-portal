import { cn } from "@/lib/utils";

type MetricsRow = {
  total_clicks: number | null;
  total_impressions: number | null;
  avg_ctr: number | null;
  avg_position: number | null;
  total_sessions: number | null;
};

interface Props {
  current: MetricsRow;
  previous: MetricsRow;
}

function pctChange(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function fmt(val: number | null, decimals = 0): string {
  if (val == null) return "—";
  return val.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function Change({
  curr,
  prev,
  inverted = false,
}: {
  curr: number | null;
  prev: number | null;
  inverted?: boolean;
}) {
  const pct = pctChange(curr, prev);
  if (pct == null) return <span className="text-gray-400 text-xs">—</span>;

  const isPositive = inverted ? pct < 0 : pct > 0;
  const isNeutral = Math.abs(pct) < 0.1;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isNeutral && "text-gray-400",
        !isNeutral && isPositive && "text-green-600",
        !isNeutral && !isPositive && "text-red-500"
      )}
    >
      {!isNeutral && (
        <svg
          className="w-3 h-3"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path
            strokeLinecap="round" strokeLinejoin="round"
            d={isPositive ? "M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" : "M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25"}
          />
        </svg>
      )}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function MetricsComparison({ current, previous }: Props) {
  const rows: {
    label: string;
    currVal: number | null;
    prevVal: number | null;
    decimals?: number;
    inverted?: boolean;
  }[] = [
    { label: "Clics totales",      currVal: current.total_clicks,      prevVal: previous.total_clicks },
    { label: "Impresiones",        currVal: current.total_impressions,  prevVal: previous.total_impressions },
    { label: "CTR promedio",       currVal: current.avg_ctr,            prevVal: previous.avg_ctr,       decimals: 2 },
    { label: "Posición promedio",  currVal: current.avg_position,       prevVal: previous.avg_position,  decimals: 2, inverted: true },
    { label: "Sesiones totales",   currVal: current.total_sessions,     prevVal: previous.total_sessions },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Comparación con mes anterior
      </p>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">
                Métrica
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mes anterior
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Este mes
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider pr-5">
                Cambio
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2.5 text-xs font-medium text-gray-600">
                  {row.label}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                  {fmt(row.prevVal, row.decimals)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-800">
                  {fmt(row.currVal, row.decimals)}
                </td>
                <td className="px-4 py-2.5 text-right pr-5">
                  <Change curr={row.currVal} prev={row.prevVal} inverted={row.inverted} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
