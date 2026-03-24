"use server";

import { createClient } from "@/lib/supabase/server";
import type { KBFolder, KBArticle } from "@/lib/kb-offline";

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function createFolder(
  name: string,
  parentId: string | null = null
): Promise<KBFolder> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("kb_folders")
    .insert({ name: name.trim(), parent_id: parentId, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as KBFolder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kb_folders")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteFolder(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("kb_folders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function createArticle(
  title: string,
  folderId: string | null = null
): Promise<KBArticle> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("kb_articles")
    .insert({
      title: title.trim(),
      folder_id: folderId,
      content: "",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as KBArticle;
}

export async function updateArticle(
  id: string,
  title: string,
  content: string
): Promise<KBArticle> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("kb_articles")
    .update({ title: title.trim(), content, updated_by: user.id })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as KBArticle;
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("kb_articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveArticle(
  id: string,
  folderId: string | null
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kb_articles")
    .update({ folder_id: folderId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
