import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/feedback/states";
import { SettingsWorkspace } from "@/features/configuracoes/settings-workspace";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/data/app-settings";
import { listInstagramAccounts } from "@/lib/data/instagram-accounts";
import { listContentSeries } from "@/lib/data/content-series";
import { listChecklistItems } from "@/lib/data/checklist-items";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Configurações — Cami Content OS" };

export default async function ConfiguracoesPage() {
  let db;try{db=await createClient()}catch{return <ErrorState title="Supabase não configurado"/>}
  const{data:{user}}=await db.auth.getUser();if(!user)redirect("/login?proximo=/configuracoes");
  const[settings,accounts,series,checklist]=await Promise.all([getAppSettings(db,user.id),listInstagramAccounts(db),listContentSeries(db),listChecklistItems(db)]);
  if(!settings)return <ErrorState title="Configurações não encontradas" description="Aplique as migrations e entre novamente para criar as preferências iniciais."/>;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description="Pilares, formatos, objetivos, CTAs, contas do Instagram, produtos e campanhas — tudo editável por você."
      />
      <SettingsWorkspace settings={settings} accounts={accounts} series={series.map(item=>item.name)} checklist={checklist.filter(item=>item.is_active).map(item=>item.label)}/>
    </div>
  );
}
