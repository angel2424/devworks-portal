export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getDeliverableDetail } from "@/app/(dashboard)/dashboard/clients/[id]/deliverables/actions";
import { DeliverableActions } from "./DeliverableActions";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_COLOR,
  DELIVERABLE_TYPE_LABEL,
  FIELD_TYPE_LABEL,
} from "@/lib/deliverables/types";
import type {
  DeliverableStatus,
  DeliverableType,
  FieldType,
  DeliverableField,
  DeliverableOption,
  DeliverableFieldResponse,
  DeliverableDecisionResponse,
} from "@/lib/deliverables/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ id: string; did: string }>;
}) {
  const { id: clientId, did } = await params;
  const supabase = await createClient();

  const [{ data: client }, deliverable] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .single(),
    getDeliverableDetail(did),
  ]);

  if (!client) notFound();
  if (!deliverable) notFound();

  const fields = (deliverable.fields ?? []) as DeliverableField[];
  const options = (deliverable.options ?? []) as DeliverableOption[];
  const fieldResponses = (deliverable.field_responses ?? []) as DeliverableFieldResponse[];
  const decisionResponses = (deliverable.decision_responses ?? []) as DeliverableDecisionResponse[];

  const sortedFields = [...fields].sort((a, b) => a.order_index - b.order_index);
  const sortedOptions = [...options].sort((a, b) => a.order_index - b.order_index);

  const responseByField = new Map(
    fieldResponses.map((r) => [r.field_id, r])
  );

  const decisionResponse = decisionResponses[0] ?? null;
  const chosenOption = decisionResponse?.option_id
    ? sortedOptions.find((o) => o.id === decisionResponse.option_id)
    : null;

  const hasResponses =
    deliverable.type === "form"
      ? fieldResponses.length > 0
      : decisionResponses.length > 0;

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-4xl mx-auto">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-7 px-2 flex-wrap">
        <Link href="/dashboard/clients" className="hover:text-gray-600 transition-colors">
          Clientes
        </Link>
        <ChevronIcon />
        <Link href={`/dashboard/clients/${clientId}`} className="hover:text-gray-600 transition-colors">
          {client.name}
        </Link>
        <ChevronIcon />
        <span className="text-gray-600 font-medium truncate max-w-[200px]">
          {deliverable.title}
        </span>
      </nav>

      {/* ── Header card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {DELIVERABLE_TYPE_LABEL[deliverable.type as DeliverableType]}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${DELIVERABLE_STATUS_COLOR[deliverable.status as DeliverableStatus]}`}
              >
                {DELIVERABLE_STATUS_LABEL[deliverable.status as DeliverableStatus]}
              </Badge>
            </div>
            <h1 className="font-heading text-2xl text-gray-900 mb-1">
              {deliverable.title}
            </h1>
            {deliverable.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {deliverable.description}
              </p>
            )}
          </div>

          <DeliverableActions
            deliverableId={did}
            clientId={clientId}
            status={deliverable.status as DeliverableStatus}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
          <span>
            Creado:{" "}
            <span className="text-gray-600">
              {formatDate(deliverable.created_at)}
            </span>
          </span>
          {deliverable.published_at && (
            <span>
              Publicado:{" "}
              <span className="text-gray-600">
                {formatDate(deliverable.published_at)}
              </span>
            </span>
          )}
          {deliverable.submitted_at && (
            <span>
              Respondido:{" "}
              <span className="text-gray-600">
                {formatDate(deliverable.submitted_at)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Fields / Options preview ── */}
      {deliverable.type === "form" ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Campos del formulario
              <span className="ml-2 text-xs font-normal text-gray-400">
                {sortedFields.length} campo{sortedFields.length !== 1 ? "s" : ""}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {sortedFields.map((field) => {
              const response = responseByField.get(field.id);
              return (
                <div key={field.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">
                          {field.label}
                        </p>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {FIELD_TYPE_LABEL[field.field_type as FieldType]}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-400">Requerido</span>
                        )}
                      </div>
                      {field.hint && (
                        <p className="text-xs text-gray-400 mt-0.5">{field.hint}</p>
                      )}
                    </div>
                    {/* Response value */}
                    {hasResponses && (
                      <div className="text-right">
                        {response ? (
                          <div>
                            {response.value_file_url ? (
                              <a
                                href={response.value_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brand-600 hover:underline"
                              >
                                {response.value_file_name ?? "Ver archivo"}
                              </a>
                            ) : (
                              <p className="text-sm text-gray-700 max-w-xs text-left">
                                {response.value_text || "—"}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">Sin respuesta</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {sortedFields.length === 0 && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">
              No hay campos definidos.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Opciones para el cliente
              <span className="ml-2 text-xs font-normal text-gray-400">
                {sortedOptions.length} opcion{sortedOptions.length !== 1 ? "es" : ""}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {sortedOptions.map((opt, idx) => {
              const isChosen = chosenOption?.id === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`px-6 py-4 flex items-start gap-4 ${
                    isChosen ? "bg-green-50/60" : ""
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0 mt-0.5 border-gray-200 bg-gray-50">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                      {isChosen && (
                        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          Elegida
                        </span>
                      )}
                    </div>
                    {opt.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Client comment */}
          {decisionResponse?.comment && (
            <div className="px-6 py-4 border-t border-gray-100 bg-amber-50/40">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Comentario del cliente
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {decisionResponse.comment}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChevronIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
