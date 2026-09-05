import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/feedback/states";
import { RevenueWorkspace } from "@/features/negocio/revenue-workspace";
import { listCampaigns } from "@/lib/data/campaigns";
import { listCampaignPayments } from "@/lib/data/campaign-payments";
import { listContentItems } from "@/lib/data/content-items";
import { listGoals } from "@/lib/data/goals";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { listProducts } from "@/lib/data/products";
import { listSalesRecords } from "@/lib/data/sales-records";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Receita — Negócio — Cami Content OS" };

export default async function NegocioReceitaPage() {
  let db;try{db=await createClient()}catch{return <ErrorState title="Supabase não configurado"/>}const{data:{user}}=await db.auth.getUser();if(!user)redirect("/login?proximo=/negocio/receita");
  let data;try{const[campaigns,payments,records,products,contents,goals]=await Promise.all([listCampaigns(db),listCampaignPayments(db),listSalesRecords(db),listProducts(db,{includeInactive:true}),listContentItems(db),listGoals(db)]);const snapshots=await listMetricSnapshotsForItems(db,contents.map(c=>c.id));data={campaigns,payments,records,products,contents,goals,snapshots}}catch{data=null}
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Receita"
        description="Produtos, vendas e receita atribuídos aos conteúdos que geraram resultado."
        breadcrumbs={[{ label: "Negócio" }, { label: "Receita" }]}
      />
      {data?<RevenueWorkspace {...data}/>:<ErrorState title="Não foi possível carregar Receita"/>}
    </div>
  );
}
