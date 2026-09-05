import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { CampaignPayment, CampaignPaymentInsert, CampaignPaymentUpdate } from "@/types/domain";

export async function listCampaignPayments(db: DbClient, campaignId?: string): Promise<CampaignPayment[]> {
  let query = db.from("campaign_payments").select("*").order("due_date", { ascending: true });
  if (campaignId) query = query.eq("campaign_id", campaignId);
  return unwrap(await query);
}

export async function createCampaignPayment(db: DbClient, input: CampaignPaymentInsert): Promise<CampaignPayment> {
  return unwrap(await db.from("campaign_payments").insert(input).select().single());
}

export async function updateCampaignPayment(db: DbClient, id: string, patch: CampaignPaymentUpdate): Promise<CampaignPayment> {
  return unwrap(await db.from("campaign_payments").update(patch).eq("id", id).select().single());
}

export async function deleteCampaignPayment(db: DbClient, id: string): Promise<void> {
  const result = await db.from("campaign_payments").delete().eq("id", id);
  if (result.error) throw result.error;
}
