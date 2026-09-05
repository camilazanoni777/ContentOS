import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type { Campaign, CampaignInsert, CampaignUpdate } from "@/types/domain";

export async function listCampaigns(db: DbClient, options?: { includeArchived?: boolean }): Promise<Campaign[]> {
  let query = db.from("campaigns").select("*").order("created_at", { ascending: false });
  if (!options?.includeArchived) query = query.is("archived_at", null);
  const result = await query;
  return unwrap(result);
}

export async function getCampaignById(db: DbClient, id: string): Promise<Campaign | null> {
  const result = await db.from("campaigns").select("*").eq("id", id).maybeSingle();
  return unwrapNullable(result);
}

export async function createCampaign(db: DbClient, input: CampaignInsert): Promise<Campaign> {
  const result = await db.from("campaigns").insert(input).select().single();
  return unwrap(result);
}

export async function updateCampaign(
  db: DbClient,
  id: string,
  patch: CampaignUpdate,
): Promise<Campaign> {
  const result = await db.from("campaigns").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function archiveCampaign(db: DbClient, id: string): Promise<Campaign> {
  const result = await db.from("campaigns").update({ archived_at: new Date().toISOString() }).eq("id", id).select().single();
  return unwrap(result);
}
