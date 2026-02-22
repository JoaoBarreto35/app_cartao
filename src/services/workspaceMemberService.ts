import { supabase } from "../lib/supabaseClient";

export type WorkspaceRole = "admin" | "viewer";

export async function getMyWorkspaceRole(workspaceId: string): Promise<WorkspaceRole | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);

  const userId = authData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.role as WorkspaceRole) ?? null;
}


export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "admin" | "viewer";
  created_at: string;
};

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("id,workspace_id,user_id,role,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceMember[];
}