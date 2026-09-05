import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { GravacaoWorkspace } from "@/features/gravacao/gravacao-workspace";
import { listContentItems } from "@/lib/data/content-items";
import { listAllSessionItems, listRecordingSessions } from "@/lib/data/recording-sessions";
import { DataAccessError } from "@/lib/data/errors";
import { GRAVACAO_STATUSES } from "@/lib/recording";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gravação — Cami Content OS" };

export default async function GravacaoPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/gravacao");

  let data: { items: Awaited<ReturnType<typeof listContentItems>>; sessions: Awaited<ReturnType<typeof listRecordingSessions>>; sessionItems: Awaited<ReturnType<typeof listAllSessionItems>> } | null = null;
  let loadError: string | null = null;
  try {
    const [items, sessions] = await Promise.all([
      listContentItems(supabase, { status: GRAVACAO_STATUSES }),
      listRecordingSessions(supabase),
    ]);
    const sessionItems = await listAllSessionItems(supabase, sessions.map((session) => session.id));
    data = { items, sessions, sessionItems };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar Gravação.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gravação" description="Conteúdos prontos para gravar ou já gravados — organize sessões em lote para reduzir trocas de cenário e roupa." />
      {data ? (
        <GravacaoWorkspace initialItems={data.items} initialSessions={data.sessions} initialSessionItems={data.sessionItems} />
      ) : (
        <ErrorState title="Não foi possível carregar Gravação" description={loadError ?? undefined} />
      )}
    </div>
  );
}
