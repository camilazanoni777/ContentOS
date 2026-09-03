import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { Campaign, CampaignInsert, CampaignUpdate } from "@/types/domain";

export async function listCampaigns(db: DbClient): Promise<Campaign[]> {
  const result = await db.from("campaigns").select("*").order("created_at", { ascending: false });
  return unwrap(result);
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

export async function deleteCampaign(db: DbClient, id: string): Promise<void> {
  const result = await db.from("campaigns").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
