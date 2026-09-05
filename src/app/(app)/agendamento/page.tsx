import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { AgendamentoList } from "@/features/agendamento/agendamento-list";
import { listCampaigns } from "@/lib/data/campaigns";
import { listContentItems } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { AGENDAMENTO_STATUSES } from "@/lib/agendamento";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agendamento — Cami Content OS" };

export default async function AgendamentoPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/agendamento");

  let data: { items: Awaited<ReturnType<typeof listContentItems>>; campaigns: Awaited<ReturnType<typeof listCampaigns>> } | null = null;
  let loadError: string | null = null;
  try {
    const [items, campaigns] = await Promise.all([
      listContentItems(supabase, { status: AGENDAMENTO_STATUSES }),
      listCampaigns(supabase),
    ]);
    data = { items, campaigns };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar Agendamento.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agendamento"
        description="Conteúdos aprovados, prontos para a checagem final antes de publicar."
      />
      {data ? (
        <AgendamentoList initialItems={data.items} campaigns={data.campaigns} />
      ) : (
        <ErrorState title="Não foi possível carregar Agendamento" description={loadError ?? undefined} />
      )}
    </div>
  );
}
