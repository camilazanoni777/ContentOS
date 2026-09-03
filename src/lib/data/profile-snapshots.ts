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

/** Uma leitura por conta por dia (constraint unique (account_id, snapshot_date)). */
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
