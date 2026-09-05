import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { IdeasWorkspace } from "@/features/ideias/ideas-workspace";
import { getAppSettings } from "@/lib/data/app-settings";
import { listContentItems, listContentStatusHistoryForItems } from "@/lib/data/content-items";
import { listContentSeries } from "@/lib/data/content-series";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Banco de ideias — Cami Content OS" };

export default async function IdeiasPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/ideias");

  let data;
  let loadError: string | null = null;
  try {
    const [items, series, settings] = await Promise.all([
      listContentItems(supabase, { includeArchived: true }),
      listContentSeries(supabase),
      getAppSettings(supabase, user.id),
    ]);
    const history = await listContentStatusHistoryForItems(supabase, items.map((item) => item.id));
    data = { items, series, history, pillars: settings?.pillars ?? [] };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar seus conteúdos.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Banco de ideias" description="Capture, priorize e mova cada conteúdo pelo pipeline sem duplicar registros." />
      {data ? <IdeasWorkspace initialItems={data.items} initialHistory={data.history} series={data.series} configuredPillars={data.pillars} /> : <ErrorState title="Não foi possível carregar o Banco de ideias" description={loadError ?? undefined} />}
    </div>
  );
}
