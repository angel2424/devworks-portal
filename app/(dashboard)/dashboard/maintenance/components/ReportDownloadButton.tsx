"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { getReportSignedUrl } from "../[planId]/actions";
import { ReportPreviewDialog, type ReportTask, type ReportMetrics } from "./ReportPreviewDialog";

interface Props {
  month: number;
  year: number;
  monthNumber: number;
  reportGeneratedAt: string | null;
  reportStoragePath: string | null;
  // Report content
  clientName: string;
  tasks: ReportTask[];
  metrics: ReportMetrics;
  prevMetrics: ReportMetrics;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getGenerationDate(month: number, year: number): Date {
  const lastDay = new Date(year, month, 0);
  const genDate = new Date(lastDay);
  genDate.setDate(genDate.getDate() - 2);
  return genDate;
}

export function ReportDownloadButton({
  month,
  year,
  monthNumber,
  reportGeneratedAt,
  reportStoragePath,
  clientName,
  tasks,
  metrics,
  prevMetrics,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const genDate = getGenerationDate(month, year);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  genDate.setHours(0, 0, 0, 0);
  const daysUntilGen = Math.ceil(
    (genDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  function handleDownload() {
    if (!reportStoragePath) return;
    setError(null);
    startTransition(async () => {
      try {
        const url = await getReportSignedUrl(reportStoragePath);
        window.open(url, "_blank");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al obtener el reporte");
      }
    });
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              reportGeneratedAt ? "bg-blue-50" : "bg-gray-100"
            )}
          >
            <svg
              className={cn("w-5 h-5", reportGeneratedAt ? "text-blue-500" : "text-gray-400")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">
              Reporte mensual — {MONTH_NAMES[month - 1]} {year}
            </p>

            {reportGeneratedAt ? (
              <p className="text-xs text-gray-500 mt-0.5">
                Generado el{" "}
                {new Date(reportGeneratedAt).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : daysUntilGen > 0 ? (
              <p className="text-xs text-gray-500 mt-0.5">
                Se generará automáticamente el{" "}
                <span className="font-medium text-gray-700">
                  {genDate.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
                </span>
                {daysUntilGen === 1 ? " (mañana)" : ` (en ${daysUntilGen} días)`}
              </p>
            ) : (
              <p className="text-xs text-amber-600 mt-0.5">
                La generación automática está pendiente.
              </p>
            )}

            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Preview — always available */}
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Vista previa
            </button>

            {/* Download PDF — only when stored report exists */}
            {reportStoragePath && (
              <button
                onClick={handleDownload}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  isPending
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-wait"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                )}
              >
                {isPending ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cargando…
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Descargar PDF
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <ReportPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        clientName={clientName}
        month={month}
        year={year}
        monthNumber={monthNumber}
        tasks={tasks}
        metrics={metrics}
        prevMetrics={prevMetrics}
      />
    </>
  );
}
