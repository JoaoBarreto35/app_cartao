import { supabase } from "../lib/supabaseClient";
import type { TransactionClass } from "../models/transactionClass";

export async function listClassesByWorkspace(workspaceId: string): Promise<TransactionClass[]> {
  const { data, error } = await supabase
    .from("transaction_classes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TransactionClass[];
}

export async function createClass(workspaceId: string, name: string): Promise<TransactionClass> {
  const payload = { workspace_id: workspaceId, name: name.trim() };

  const { data, error } = await supabase
    .from("transaction_classes")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as TransactionClass;
}

export async function updateClass(classId: string, name: string): Promise<TransactionClass> {
  const payload = { name: name.trim() };

  const { data, error } = await supabase
    .from("transaction_classes")
    .update(payload)
    .eq("id", classId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as TransactionClass;
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await supabase.from("transaction_classes").delete().eq("id", classId);
  if (error) throw new Error(error.message);
}