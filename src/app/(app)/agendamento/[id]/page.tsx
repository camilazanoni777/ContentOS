import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { getContentItemById } from "@/lib/data/content-items";
import { listCampaigns } from "@/lib/data/campaigns";
import { listProducts } from "@/lib/data/products";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { AgendamentoWorkspace } from "@/features/agendamento/agendamento-workspace";

export const metadata: Metadata = { title: "Agendamento — Cami Content OS" };

async function loadAgendamentoWorkspaceData(supabase: DbClient, id: string) {
  const [item, campaigns, products] = await Promise.all([
    getContentItemById(supabase, id),
    listCampaigns(supabase),
    listProducts(supabase),
  ]);
  return { item, campaigns, products };
}

export default async function AgendamentoWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?proximo=/agendamento/${id}`);

  let data: Awaited<ReturnType<typeof loadAgendamentoWorkspaceData>> | null = null;
  let loadError: string | null = null;
  try {
    data = await loadAgendamentoWorkspaceData(supabase, id);
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar este agendamento.";
  }

  if (!data) {
    return <ErrorState title="Não foi possível carregar este agendamento" description={loadError ?? undefined} />;
  }
  if (!data.item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.item.title}
        description="Workspace de agendamento — data/hora, legenda final, hashtags, CTA, campanha/produto, capa e checklist final."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={data.item.status} />
            <Button asChild variant="outline">
              <Link href="/agendamento">Voltar para Agendamento</Link>
            </Button>
          </div>
        }
      />
      <AgendamentoWorkspace item={data.item} campaigns={data.campaigns} products={data.products} />
    </div>
  );
}
