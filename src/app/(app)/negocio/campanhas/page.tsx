import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/feedback/states";
import { CampaignsWorkspace } from "@/features/negocio/campaigns-workspace";
import { listCampaigns } from "@/lib/data/campaigns";
import { listCampaignPayments } from "@/lib/data/campaign-payments";
import { listInstagramAccounts } from "@/lib/data/instagram-accounts";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Campanhas — Negócio — Cami Content OS" };

export default async function NegocioCampanhasPage() {
  let db; try { db=await createClient(); } catch { return <ErrorState title="Supabase não configurado"/>; }
  const {data:{user}}=await db.auth.getUser(); if(!user) redirect("/login?proximo=/negocio/campanhas");
  let data; try { const [campaigns,payments,accounts]=await Promise.all([listCampaigns(db),listCampaignPayments(db),listInstagramAccounts(db)]);data={campaigns,payments,accounts}; } catch { data=null; }
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campanhas"
        description="Campanhas de marketing e lançamento associadas aos seus conteúdos."
        breadcrumbs={[{ label: "Negócio" }, { label: "Campanhas" }]}
      />
      {data?<CampaignsWorkspace initialCampaigns={data.campaigns} payments={data.payments} accounts={data.accounts}/>:<ErrorState title="Não foi possível carregar Campanhas"/>}
    </div>
  );
}
