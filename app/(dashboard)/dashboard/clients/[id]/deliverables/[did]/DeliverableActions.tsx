"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  publishDeliverable,
  approveDeliverable,
  archiveDeliverable,
} from "@/app/(dashboard)/dashboard/clients/[id]/deliverables/actions";
import type { DeliverableStatus } from "@/lib/deliverables/types";
import { Send, CheckCircle, Archive } from "lucide-react";

type Props = {
  deliverableId: string;
  clientId: string;
  status: DeliverableStatus;
};

export function DeliverableActions({ deliverableId, clientId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<void>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  if (status === "archived") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <Button
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-white text-xs gap-1.5"
          disabled={isPending}
          onClick={() =>
            run(() => publishDeliverable(deliverableId, clientId))
          }
        >
          <Send className="w-3.5 h-3.5" />
          {isPending ? "Publicando…" : "Publicar y notificar cliente"}
        </Button>
      )}

      {status === "submitted" && (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5"
          disabled={isPending}
          onClick={() =>
            run(() => approveDeliverable(deliverableId, clientId))
          }
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {isPending ? "Aprobando…" : "Aprobar respuesta"}
        </Button>
      )}

      {status !== "approved" && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 text-gray-500 border-gray-200"
          disabled={isPending}
          onClick={() =>
            run(() => archiveDeliverable(deliverableId, clientId))
          }
        >
          <Archive className="w-3.5 h-3.5" />
          Archivar
        </Button>
      )}
    </div>
  );
}
