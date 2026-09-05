import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { CampaignDeliverable, CampaignDeliverableInsert, CampaignDeliverableUpdate } from "@/types/domain";

export async function listCampaignDeliverables(db: DbClient, campaignId?: string): Promise<CampaignDeliverable[]> {
  let query = db.from("campaign_deliverables").select("*").order("sort_order").order("created_at");
  if (campaignId) query = query.eq("campaign_id", campaignId);
  return unwrap(await query);
}

export async function createCampaignDeliverable(db: DbClient, input: CampaignDeliverableInsert): Promise<CampaignDeliverable> {
  return unwrap(await db.from("campaign_deliverables").insert(input).select().single());
}

export async function updateCampaignDeliverable(db: DbClient, id: string, patch: CampaignDeliverableUpdate): Promise<CampaignDeliverable> {
  return unwrap(await db.from("campaign_deliverables").update(patch).eq("id", id).select().single());
}

export async function deleteCampaignDeliverable(db: DbClient, id: string): Promise<void> {
  const result = await db.from("campaign_deliverables").delete().eq("id", id);
  if (result.error) throw result.error;
}
