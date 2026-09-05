import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { CampaignDetailWorkspace } from "@/features/negocio/campaign-detail-workspace";
import { getCampaignById } from "@/lib/data/campaigns";
import { listCampaignDeliverables } from "@/lib/data/campaign-deliverables";
import { listCampaignPayments } from "@/lib/data/campaign-payments";
import { listContentItems } from "@/lib/data/content-items";
import { listProducts } from "@/lib/data/products";
import { listSalesRecords } from "@/lib/data/sales-records";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { createClient } from "@/lib/supabase/server";
export const metadata:Metadata={title:"Detalhe da campanha — Cami Content OS"};
export default async function CampaignPage({params}:{params:Promise<{id:string}>}){const{id}=await params;let db;try{db=await createClient()}catch{return <ErrorState title="Supabase não configurado"/>}const{data:{user}}=await db.auth.getUser();if(!user)redirect(`/login?proximo=/negocio/campanhas/${id}`);let data;try{const[campaign,deliverables,payments,contents,products,sales]=await Promise.all([getCampaignById(db,id),listCampaignDeliverables(db,id),listCampaignPayments(db,id),listContentItems(db),listProducts(db,{includeInactive:true}),listSalesRecords(db,{campaignId:id})]);const snapshots=await listMetricSnapshotsForItems(db,contents.map(c=>c.id));data={campaign,deliverables,payments,contents,products,sales,snapshots}}catch{return <ErrorState title="Não foi possível carregar a campanha"/>}if(!data.campaign)notFound();return <div className="flex flex-col gap-6"><PageHeader title={data.campaign.name} description={data.campaign.brand_name??"Campanha e parceria"} breadcrumbs={[{label:"Negócio"},{label:"Campanhas",href:"/negocio/campanhas"},{label:data.campaign.name}]} actions={<Button asChild variant="outline"><Link href="/negocio/campanhas">Voltar</Link></Button>}/><CampaignDetailWorkspace campaign={data.campaign} initialDeliverables={data.deliverables} initialPayments={data.payments} allContents={data.contents} products={data.products} salesRecords={data.sales} metricSnapshots={data.snapshots}/></div>}
