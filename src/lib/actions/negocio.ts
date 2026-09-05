"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { archiveCampaign, createCampaign, updateCampaign } from "@/lib/data/campaigns";
import { archiveProduct, createProduct, updateProduct } from "@/lib/data/products";
import { createCampaignDeliverable, deleteCampaignDeliverable, updateCampaignDeliverable } from "@/lib/data/campaign-deliverables";
import { createCampaignPayment, deleteCampaignPayment, updateCampaignPayment } from "@/lib/data/campaign-payments";
import { createSalesRecord, deleteSalesRecord, updateSalesRecord } from "@/lib/data/sales-records";
import { updateContentItem } from "@/lib/data/content-items";
import { getMetricSnapshotById } from "@/lib/data/metric-snapshots";
import { campaignSchema, deliverableSchema, paymentSchema, productSchema, salesRecordSchema } from "@/lib/validations/negocio";
import { DataAccessError } from "@/lib/data/errors";
import { fromDateTimeLocalInput } from "@/lib/dates";
import type { Campaign, CampaignDeliverable, CampaignPayment, Product, SalesRecord } from "@/types/domain";

type Result<T> = { success: true; value: T } | { error: string };
type SimpleResult = { success: true } | { error: string };

async function context() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  return { db, user };
}
function errorMessage(error: unknown, fallback: string) { return error instanceof DataAccessError ? error.message : fallback; }
function refresh() { revalidatePath("/negocio/campanhas"); revalidatePath("/negocio/produtos"); revalidatePath("/negocio/receita"); revalidatePath("/alertas"); }

export async function saveCampaign(input: unknown, id?: string): Promise<Result<Campaign>> {
  const parsed = campaignSchema.safeParse(input); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise a campanha." };
  const { db, user } = await context(); if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  const d = parsed.data;
  const payload = { user_id: user.id, name: d.name, brand_name: d.brandName, campaign_type: d.campaignType, account_id: d.accountId, contact_name: d.contactName, contact_email: d.contactEmail, contact_phone: d.contactPhone, contact_notes: d.contactNotes, first_contact_date: d.firstContactDate, delivery_due_date: d.deliveryDueDate, published_at: fromDateTimeLocalInput(d.publishedAt), contracted_fee: d.contractedFee, currency: d.currency, negotiation_status: d.negotiationStatus, contract_status: d.contractStatus, delivery_status: d.deliveryStatus, payment_status: d.paymentStatus, expected_payment_date: d.expectedPaymentDate, briefing_url: d.briefingUrl, contract_url: d.contractUrl, folder_url: d.folderUrl, publication_url: d.publicationUrl, responsible_name: d.responsibleName, notes: d.notes };
  try { const value = id ? await updateCampaign(db, id, payload) : await createCampaign(db, payload); refresh(); return { success: true, value }; } catch (e) { return { error: errorMessage(e, "Não foi possível salvar a campanha.") }; }
}
export async function archiveCampaignAction(id: string): Promise<SimpleResult> { const { db, user } = await context(); if (!user) return { error: "Sua sessão expirou." }; try { await archiveCampaign(db, id); refresh(); return { success: true }; } catch(e) { return { error: errorMessage(e, "Não foi possível arquivar.") }; } }

export async function saveDeliverable(input: unknown, id?: string): Promise<Result<CampaignDeliverable>> { const parsed=deliverableSchema.safeParse(input); if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Revise o entregável."}; const {db,user}=await context();if(!user)return{error:"Sua sessão expirou."};const d=parsed.data;try{const value=id?await updateCampaignDeliverable(db,id,{content_item_id:d.contentItemId,title:d.title,quantity:d.quantity,status:d.status,due_date:d.dueDate,notes:d.notes}):await createCampaignDeliverable(db,{user_id:user.id,campaign_id:d.campaignId,content_item_id:d.contentItemId,title:d.title,quantity:d.quantity,status:d.status,due_date:d.dueDate,notes:d.notes});refresh();return{success:true,value};}catch(e){return{error:errorMessage(e,"Não foi possível salvar o entregável.")};} }
export async function removeDeliverable(id:string):Promise<SimpleResult>{const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};try{await deleteCampaignDeliverable(db,id);refresh();return{success:true};}catch(e){return{error:errorMessage(e,"Não foi possível remover o entregável.")};}}

export async function savePayment(input:unknown,id?:string):Promise<Result<CampaignPayment>>{const parsed=paymentSchema.safeParse(input);if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Revise o pagamento."};const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};const d=parsed.data;const payload={amount:d.amount,received_amount:d.receivedAmount,due_date:d.dueDate,received_at:fromDateTimeLocalInput(d.receivedAt),status:d.status,notes:d.notes};try{const value=id?await updateCampaignPayment(db,id,payload):await createCampaignPayment(db,{...payload,user_id:user.id,campaign_id:d.campaignId});refresh();return{success:true,value};}catch(e){return{error:errorMessage(e,"Não foi possível salvar o pagamento.")};}}
export async function removePayment(id:string):Promise<SimpleResult>{const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};try{await deleteCampaignPayment(db,id);refresh();return{success:true};}catch(e){return{error:errorMessage(e,"Não foi possível remover o pagamento.")};}}

export async function saveProduct(input:unknown,id?:string):Promise<Result<Product>>{const parsed=productSchema.safeParse(input);if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Revise o produto."};const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};const d=parsed.data;const payload={name:d.name,status:d.status,reference_price:d.referencePrice,notes:d.notes};try{const value=id?await updateProduct(db,id,payload):await createProduct(db,{...payload,user_id:user.id});refresh();return{success:true,value};}catch(e){return{error:errorMessage(e,"Não foi possível salvar o produto.")};}}
export async function archiveProductAction(id:string):Promise<SimpleResult>{const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};try{await archiveProduct(db,id);refresh();return{success:true};}catch(e){return{error:errorMessage(e,"Não foi possível arquivar o produto.")};}}

export async function saveSalesRecord(input:unknown,id?:string):Promise<Result<SalesRecord>>{const parsed=salesRecordSchema.safeParse(input);if(!parsed.success)return{error:parsed.error.issues[0]?.message??"Revise a venda."};const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};const d=parsed.data;const metric=d.source==="metric_snapshot";try{const snapshot=metric&&d.metricSnapshotId?await getMetricSnapshotById(db,d.metricSnapshotId):null;if(metric&&!snapshot)return{error:"A captura de métricas selecionada não existe ou não pertence à sua conta."};const payload={product_id:d.productId,campaign_id:d.campaignId,content_item_id:snapshot?.content_item_id??d.contentItemId,source:d.source,metric_snapshot_id:metric?d.metricSnapshotId:null,sale_date:d.saleDate,cta:d.cta,link_clicks:metric?null:d.linkClicks,leads:metric?null:d.leads,sales_count:metric?null:d.salesCount,revenue:metric?null:d.revenue,notes:d.notes};const value=id?await updateSalesRecord(db,id,payload):await createSalesRecord(db,{...payload,user_id:user.id});refresh();return{success:true,value};}catch(e){return{error:errorMessage(e,e instanceof DataAccessError&&e.code==="23505"?"Esta captura de métricas já está vinculada a uma venda.":"Não foi possível salvar a venda.")};}}
export async function removeSalesRecord(id:string):Promise<SimpleResult>{const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};try{await deleteSalesRecord(db,id);refresh();return{success:true};}catch(e){return{error:errorMessage(e,"Não foi possível remover a venda.")};}}

export async function linkContentToCampaign(contentItemId:string,campaignId:string|null):Promise<SimpleResult>{const{db,user}=await context();if(!user)return{error:"Sua sessão expirou."};try{await updateContentItem(db,contentItemId,{campaign_id:campaignId});refresh();revalidatePath("/ideias");revalidatePath("/roteiros");revalidatePath("/gravacao");revalidatePath("/edicao");revalidatePath("/agendamento");revalidatePath("/publicados");return{success:true};}catch(e){return{error:errorMessage(e,"Não foi possível atualizar o vínculo do conteúdo.")};}}
