import { supabase } from "../lib/supabaseClient";
import type { Category } from "../models/category";

export async function listCategoriesByWorkspace(workspaceId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function createCategory(workspaceId: string, name: string): Promise<Category> {
  const payload = { workspace_id: workspaceId, name: name.trim() };

  const { data, error } = await supabase.from("categories").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function updateCategory(categoryId: string, name: string): Promise<Category> {
  const payload = { name: name.trim() };

  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", categoryId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw new Error(error.message);
}