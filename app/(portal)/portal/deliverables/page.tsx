export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPortalDeliverables } from "./actions";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_COLOR,
  DELIVERABLE_TYPE_LABEL,
} from "@/lib/deliverables/types";
import type { DeliverableStatus, DeliverableType } from "@/lib/deliverables/types";

export default async function PortalDeliverablesPage() {
  const deliverables = await getPortalDeliverables();

  const pending = deliverables.filter((d) => d.status === "published");
  const done = deliverables.filter((d) =>
    ["submitted", "approved"].includes(d.status)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-gray-900 mb-1">
          Entregables
        </h1>
        <p className="text-sm text-gray-500">
          Formularios y decisiones pendientes de tu proyecto.
        </p>
      </div>

      {deliverables.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-5 h-5 text-brand-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="font-heading text-base font-semibold text-gray-700 mb-1">
            Sin entregables por ahora
          </h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Cuando tu equipo publique formularios o páginas de decisión,
            aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Pendientes · {pending.length}
              </h2>
              <div className="space-y-3">
                {pending.map((d) => (
                  <DeliverableCard key={d.id} deliverable={d} />
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Completados · {done.length}
              </h2>
              <div className="space-y-3">
                {done.map((d) => (
                  <DeliverableCard key={d.id} deliverable={d} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

type DeliverableCardProps = {
  deliverable: Awaited<ReturnType<typeof getPortalDeliverables>>[number];
};

function DeliverableCard({ deliverable: d }: DeliverableCardProps) {
  const isActionable = d.status === "published";
  const count =
    d.type === "form"
      ? `${d.fields.length} campo${d.fields.length !== 1 ? "s" : ""}`
      : `${d.options.length} opcion${d.options.length !== 1 ? "es" : ""}`;

  return (
    <Link
      href={`/portal/deliverables/${d.id}`}
      className={`block rounded-xl border bg-white p-5 transition-colors ${
        isActionable
          ? "border-brand-200 hover:border-brand-300 hover:bg-brand-50/20"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <TypeChip type={d.type as DeliverableType} />
            <span
              className={`text-xs border rounded-full px-2 py-0.5 font-medium ${
                DELIVERABLE_STATUS_COLOR[d.status as DeliverableStatus]
              }`}
            >
              {DELIVERABLE_STATUS_LABEL[d.status as DeliverableStatus]}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800">{d.title}</p>
          {d.description && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
              {d.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">{count}</p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isActionable && (
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full">
              Responder →
            </span>
          )}
          {!isActionable && (
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}

function TypeChip({ type }: { type: DeliverableType }) {
  return (
    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
      {DELIVERABLE_TYPE_LABEL[type]}
    </span>
  );
}
