import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { SalesRecord, SalesRecordInsert, SalesRecordUpdate } from "@/types/domain";

export async function listSalesRecords(db: DbClient, filter?: { productId?: string; campaignId?: string; from?: string; to?: string }): Promise<SalesRecord[]> {
  let query = db.from("sales_records").select("*").order("sale_date", { ascending: false });
  if (filter?.productId) query = query.eq("product_id", filter.productId);
  if (filter?.campaignId) query = query.eq("campaign_id", filter.campaignId);
  if (filter?.from) query = query.gte("sale_date", filter.from);
  if (filter?.to) query = query.lte("sale_date", filter.to);
  return unwrap(await query);
}

export async function createSalesRecord(db: DbClient, input: SalesRecordInsert): Promise<SalesRecord> {
  return unwrap(await db.from("sales_records").insert(input).select().single());
}

export async function updateSalesRecord(db: DbClient, id: string, patch: SalesRecordUpdate): Promise<SalesRecord> {
  return unwrap(await db.from("sales_records").update(patch).eq("id", id).select().single());
}

export async function deleteSalesRecord(db: DbClient, id: string): Promise<void> {
  const result = await db.from("sales_records").delete().eq("id", id);
  if (result.error) throw result.error;
}
