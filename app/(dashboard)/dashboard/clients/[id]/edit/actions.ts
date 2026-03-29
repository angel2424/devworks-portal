"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateClientContact(
  clientId: string,
  data: { name: string; email: string | null; phone: string | null }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients`);
}
