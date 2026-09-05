import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { EdicaoList } from "@/features/edicao/edicao-list";
import { listContentItems } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { EDICAO_STATUSES } from "@/lib/editing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edição — Cami Content OS" };

export default async function EdicaoPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/edicao");

  let items: Awaited<ReturnType<typeof listContentItems>> | null = null;
  let loadError: string | null = null;
  try {
    items = await listContentItems(supabase, { status: EDICAO_STATUSES });
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar Edição.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edição" description="Conteúdos gravados, em edição ou aguardando aprovação." />
      {items ? <EdicaoList initialItems={items} /> : <ErrorState title="Não foi possível carregar Edição" description={loadError ?? undefined} />}
    </div>
  );
}
