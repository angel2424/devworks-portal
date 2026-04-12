"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DeliverableType, FieldType } from "@/lib/deliverables/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldInput = {
  label: string;
  hint?: string;
  field_type: FieldType;
  required: boolean;
};

export type OptionInput = {
  label: string;
  description?: string;
};

export type CreateDeliverableInput = {
  type: DeliverableType;
  title: string;
  description?: string;
  fields?: FieldInput[];
  options?: OptionInput[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireTeamMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "team") throw new Error("Unauthorized");
  // Return the admin client for writes — auth is already verified above.
  // Supabase RLS "FOR ALL" policies without an explicit WITH CHECK clause
  // may silently block INSERT operations; using the service role avoids that.
  return { admin: createAdminClient(), profile };
}

async function getOrCreateSet(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string
): Promise<string> {
  const { data: existing } = await admin
    .from("deliverable_sets")
    .select("id")
    .eq("client_id", clientId)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await admin
    .from("deliverable_sets")
    .insert({ client_id: clientId })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[deliverables] getOrCreateSet insert error:", error);
    throw new Error("Could not create deliverable set");
  }
  return created.id;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createDeliverable(
  clientId: string,
  input: CreateDeliverableInput
): Promise<string> {
  const { admin, profile } = await requireTeamMember();

  const setId = await getOrCreateSet(admin, clientId);

  const { data: deliverable, error } = await admin
    .from("deliverables")
    .insert({
      set_id: setId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !deliverable) {
    console.error("[deliverables] createDeliverable insert error:", error);
    throw new Error("Could not create deliverable");
  }

  if (input.type === "form" && input.fields?.length) {
    await admin.from("deliverable_fields").insert(
      input.fields.map((f, i) => ({
        deliverable_id: deliverable.id,
        label: f.label,
        hint: f.hint ?? null,
        field_type: f.field_type,
        required: f.required,
        order_index: i,
      }))
    );
  }

  if (input.type === "decision" && input.options?.length) {
    await admin.from("deliverable_options").insert(
      input.options.map((o, i) => ({
        deliverable_id: deliverable.id,
        label: o.label,
        description: o.description ?? null,
        order_index: i,
      }))
    );
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return deliverable.id;
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export async function publishDeliverable(
  deliverableId: string,
  clientId: string
): Promise<void> {
  const { admin } = await requireTeamMember();

  const [{ data: client }, { data: deliverable }] = await Promise.all([
    admin.from("clients").select("email, name").eq("id", clientId).single(),
    admin.from("deliverables").select("title").eq("id", deliverableId).single(),
  ]);

  await admin
    .from("deliverables")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", deliverableId);

  if (client?.email && deliverable?.title) {
    await admin.rpc("notify_client_deliverable_published", {
      p_client_email: client.email,
      p_deliverable_title: deliverable.title,
      p_deliverable_id: deliverableId,
    });
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/deliverables/${deliverableId}`);
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export async function approveDeliverable(
  deliverableId: string,
  clientId: string
): Promise<void> {
  const { admin } = await requireTeamMember();
  await admin
    .from("deliverables")
    .update({ status: "approved" })
    .eq("id", deliverableId);
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/deliverables/${deliverableId}`);
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export async function archiveDeliverable(
  deliverableId: string,
  clientId: string
): Promise<void> {
  const { admin } = await requireTeamMember();
  await admin
    .from("deliverables")
    .update({ status: "archived" })
    .eq("id", deliverableId);
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/deliverables/${deliverableId}`);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getDeliverablesForClient(clientId: string) {
  // Use admin client — dashboard routes are already protected by layout auth.
  const admin = createAdminClient();

  const { data: set } = await admin
    .from("deliverable_sets")
    .select("id")
    .eq("client_id", clientId)
    .single();

  if (!set) return [];

  const { data } = await admin
    .from("deliverables")
    .select(
      "id, type, title, description, status, published_at, submitted_at, created_at, fields:deliverable_fields(id), options:deliverable_options(id)"
    )
    .eq("set_id", set.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getDeliverableDetail(deliverableId: string) {
  const admin = createAdminClient();

  const { data } = await admin
    .from("deliverables")
    .select(
      `
      id, set_id, type, title, description, status, published_at, submitted_at, created_at,
      fields:deliverable_fields(id, label, hint, field_type, required, order_index),
      options:deliverable_options(id, label, description, order_index),
      field_responses:deliverable_field_responses(id, field_id, value_text, value_file_url, value_file_name, responded_by),
      decision_responses:deliverable_decision_responses(id, option_id, comment, responded_by)
    `
    )
    .eq("id", deliverableId)
    .single();

  return data ?? null;
}
