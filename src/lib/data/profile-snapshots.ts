import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { ProfileSnapshot, ProfileSnapshotInsert } from "@/types/domain";

export async function listProfileSnapshots(
  db: DbClient,
  accountId: string,
): Promise<ProfileSnapshot[]> {
  const result = await db
    .from("profile_snapshots")
    .select("*")
    .eq("account_id", accountId)
    .order("snapshot_date", { ascending: true });
  return unwrap(result);
}

/**
 * Todos os registros de perfil do usuário, de todas as contas (RLS já
 * restringe a `user_id`) — usado por Metas, que agrega seguidores/receita/
 * etc. entre contas (mesma simplificação de weekly-plan.ts para o delta de
 * seguidores: sem filtro de conta).
 */
export async function listAllProfileSnapshots(db: DbClient): Promise<ProfileSnapshot[]> {
  const result = await db.from("profile_snapshots").select("*").order("snapshot_date", { ascending: true });
  return unwrap(result);
}

/** Uma leitura por conta por dia (constraint unique (account_id, snapshot_date)) — também usado para editar um registro existente (upsert na mesma chave). */
export async function recordProfileSnapshot(
  db: DbClient,
  input: ProfileSnapshotInsert,
): Promise<ProfileSnapshot> {
  const result = await db
    .from("profile_snapshots")
    .upsert(input, { onConflict: "account_id,snapshot_date" })
    .select()
    .single();
  return unwrap(result);
}

export async function deleteProfileSnapshot(db: DbClient, id: string): Promise<void> {
  const result = await db.from("profile_snapshots").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
