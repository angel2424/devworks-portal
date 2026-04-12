"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

type SetRecord = {
  client:
    | { id: string; email: string }
    | Array<{ id: string; email: string }>
    | null;
};

export type FieldResponseInput = {
  field_id: string;
  value_text?: string;
  value_file_url?: string;
  value_file_name?: string;
};

// ─── Submit form response ─────────────────────────────────────────────────────

export async function submitFormResponse(
  deliverableId: string,
  responses: FieldResponseInput[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Verify the deliverable is published and belongs to this client
  const { data: deliverable } = await supabase
    .from("deliverables")
    .select(
      "id, title, status, set:deliverable_sets!set_id(client:clients!client_id(id, email))"
    )
    .eq("id", deliverableId)
    .single();

  if (!deliverable || deliverable.status !== "published") {
    return { error: "Entregable no disponible" };
  }

  // Upsert field responses
  const rows = responses.map((r) => ({
    deliverable_id: deliverableId,
    field_id: r.field_id,
    responded_by: user.id,
    value_text: r.value_text ?? null,
    value_file_url: r.value_file_url ?? null,
    value_file_name: r.value_file_name ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await supabase
    .from("deliverable_field_responses")
    .upsert(rows, { onConflict: "field_id,responded_by" });

  if (upsertError) return { error: "Error al guardar respuestas" };

  // Mark deliverable as submitted
  await supabase
    .from("deliverables")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", deliverableId);

  // Notify assigned team member
  const clientData = Array.isArray(deliverable.set)
    ? deliverable.set[0]?.client
    : (deliverable.set as SetRecord | null)?.client;
  const clientRecord = Array.isArray(clientData) ? clientData[0] : clientData;

  if (clientRecord?.id) {
    await supabase.rpc("notify_team_deliverable_submitted", {
      p_client_id: clientRecord.id,
      p_deliverable_title: deliverable.title,
      p_deliverable_id: deliverableId,
    });
  }

  revalidatePath("/portal/deliverables");
  revalidatePath(`/portal/deliverables/${deliverableId}`);
  return {};
}

// ─── Submit decision response ─────────────────────────────────────────────────

export async function submitDecisionResponse(
  deliverableId: string,
  optionId: string,
  comment: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Verify published
  const { data: deliverable } = await supabase
    .from("deliverables")
    .select(
      "id, title, status, set:deliverable_sets!set_id(client:clients!client_id(id, email))"
    )
    .eq("id", deliverableId)
    .single();

  if (!deliverable || deliverable.status !== "published") {
    return { error: "Entregable no disponible" };
  }

  const { error: upsertError } = await supabase
    .from("deliverable_decision_responses")
    .upsert(
      {
        deliverable_id: deliverableId,
        option_id: optionId,
        responded_by: user.id,
        comment: comment || null,
      },
      { onConflict: "deliverable_id,responded_by" }
    );

  if (upsertError) return { error: "Error al guardar decisión" };

  await supabase
    .from("deliverables")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", deliverableId);

  // Notify assigned team member
  const clientData = Array.isArray(deliverable.set)
    ? deliverable.set[0]?.client
    : (deliverable.set as SetRecord | null)?.client;
  const clientRecord = Array.isArray(clientData) ? clientData[0] : clientData;

  if (clientRecord?.id) {
    await supabase.rpc("notify_team_deliverable_submitted", {
      p_client_id: clientRecord.id,
      p_deliverable_title: deliverable.title,
      p_deliverable_id: deliverableId,
    });
  }

  revalidatePath("/portal/deliverables");
  revalidatePath(`/portal/deliverables/${deliverableId}`);
  return {};
}

// ─── Get portal deliverables for current user ─────────────────────────────────

export async function getPortalDeliverables() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];

  // Find the client record by email
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!client) return [];

  const { data: set } = await supabase
    .from("deliverable_sets")
    .select("id")
    .eq("client_id", client.id)
    .single();

  if (!set) return [];

  const { data } = await supabase
    .from("deliverables")
    .select(
      "id, type, title, description, status, published_at, submitted_at, created_at, fields:deliverable_fields(id), options:deliverable_options(id)"
    )
    .eq("set_id", set.id)
    .in("status", ["published", "submitted", "approved"])
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getPortalDeliverableDetail(deliverableId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: base }, { data: fieldResponses }, { data: decisionResponse }] =
    await Promise.all([
      supabase
        .from("deliverables")
        .select(
          "id, type, title, description, status, published_at, submitted_at, created_at, fields:deliverable_fields(id, label, hint, field_type, required, order_index), options:deliverable_options(id, label, description, order_index)"
        )
        .eq("id", deliverableId)
        .single(),
      supabase
        .from("deliverable_field_responses")
        .select("id, field_id, value_text, value_file_url, value_file_name")
        .eq("deliverable_id", deliverableId)
        .eq("responded_by", user.id),
      supabase
        .from("deliverable_decision_responses")
        .select("id, option_id, comment")
        .eq("deliverable_id", deliverableId)
        .eq("responded_by", user.id)
        .maybeSingle(),
    ]);

  if (!base) return null;

  return {
    ...base,
    my_field_responses: fieldResponses ?? [],
    my_decision_response: decisionResponse ?? null,
  };
}
