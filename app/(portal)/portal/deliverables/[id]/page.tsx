export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getPortalDeliverableDetail } from "../actions";
import { FormResponseForm, DecisionResponseForm } from "./ResponseForm";
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
} from "@/lib/deliverables/types";

export default async function PortalDeliverableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deliverable = await getPortalDeliverableDetail(id);

  if (!deliverable) notFound();

  const fields = (deliverable.fields ?? []) as DeliverableField[];
  const options = (deliverable.options ?? []) as DeliverableOption[];
  const myFieldResponses = deliverable.my_field_responses ?? [];
  const myDecisionResponse = deliverable.my_decision_response ?? null;

  const sortedFields = [...fields].sort((a, b) => a.order_index - b.order_index);
  const sortedOptions = [...options].sort((a, b) => a.order_index - b.order_index);

  const isResponded = ["submitted", "approved"].includes(deliverable.status);
  const isApproved = deliverable.status === "approved";

  const responseByField = new Map(
    myFieldResponses.map((r: { field_id: string; value_text: string | null; value_file_url: string | null }) => [
      r.field_id,
      r,
    ])
  );

  const chosenOption = myDecisionResponse?.option_id
    ? sortedOptions.find((o) => o.id === myDecisionResponse.option_id)
    : null;

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-7 flex-wrap">
        <Link
          href="/portal/deliverables"
          className="hover:text-gray-700 transition-colors"
        >
          Entregables
        </Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 font-medium truncate max-w-[220px]">
          {deliverable.title}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {DELIVERABLE_TYPE_LABEL[deliverable.type as DeliverableType]}
          </span>
          <Badge
            variant="outline"
            className={`text-xs ${DELIVERABLE_STATUS_COLOR[deliverable.status as DeliverableStatus]}`}
          >
            {DELIVERABLE_STATUS_LABEL[deliverable.status as DeliverableStatus]}
          </Badge>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
          {deliverable.title}
        </h1>
        {deliverable.description && (
          <p className="text-sm text-gray-500 leading-relaxed">
            {deliverable.description}
          </p>
        )}
      </div>

      {/* ── Already responded: read-only view ── */}
      {isResponded ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {isApproved
                ? "Respuesta aprobada por el equipo."
                : "Tu respuesta fue enviada al equipo. Te notificaremos cuando sea revisada."}
            </p>
          </div>

          {/* Read-only form summary */}
          {deliverable.type === "form" ? (
            <div className="divide-y divide-gray-100">
              {sortedFields.map((field) => {
                const resp = responseByField.get(field.id) as
                  | { value_text: string | null; value_file_url: string | null }
                  | undefined;
                return (
                  <div key={field.id} className="py-3.5 first:pt-0 last:pb-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {field.label}
                      <span className="ml-1.5 normal-case font-normal text-gray-300">
                        · {FIELD_TYPE_LABEL[field.field_type as FieldType]}
                      </span>
                    </p>
                    {resp?.value_file_url ? (
                      <a
                        href={resp.value_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 hover:underline"
                      >
                        Ver archivo
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {resp?.value_text || (
                          <span className="text-gray-300 italic">Sin respuesta</span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {chosenOption && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Opción elegida
                  </p>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-semibold text-green-800">
                      {chosenOption.label}
                    </p>
                    {chosenOption.description && (
                      <p className="text-xs text-green-600 mt-0.5">
                        {chosenOption.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {myDecisionResponse?.comment && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Tu comentario
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {myDecisionResponse.comment}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Active: response form ── */
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {deliverable.type === "form" ? (
            <FormResponseForm
              deliverableId={id}
              fields={sortedFields}
            />
          ) : (
            <DecisionResponseForm
              deliverableId={id}
              options={sortedOptions}
            />
          )}
        </div>
      )}
    </div>
  );
}
