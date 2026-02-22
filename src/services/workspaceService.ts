import { supabase } from "../lib/supabaseClient";
import type { Workspace } from "../models/workspace";

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,name,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Workspace[];
}

export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,name,credit_limit,created_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as Workspace | null;
}

export async function updateWorkspaceLimit(
  workspaceId: string,
  creditLimit: number | null
): Promise<Workspace> {
  const payload = {
    credit_limit: creditLimit === null ? null : creditLimit.toFixed(2),
  };

  const { data, error } = await supabase
    .from("workspaces")
    .update(payload)
    .eq("id", workspaceId)
    .select("id,name,credit_limit,created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as Workspace;
}