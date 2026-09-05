import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { getContentItemById } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { parseScriptStructure } from "@/lib/script-workspace";
import { resolveTeleprompterText } from "@/lib/teleprompter";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { TeleprompterView } from "@/features/roteiros/teleprompter-view";

export const metadata: Metadata = { title: "Teleprompter — Cami Content OS" };

async function loadTeleprompterItem(supabase: DbClient, id: string) {
  return getContentItemById(supabase, id);
}

export default async function TeleprompterPage({ params }: { params: Promise<{ id: string }> }) {
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
  if (!user) redirect(`/login?proximo=/roteiros/${id}/teleprompter`);

  let item: Awaited<ReturnType<typeof loadTeleprompterItem>> | null = null;
  let loadError: string | null = null;
  try {
    item = await loadTeleprompterItem(supabase, id);
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar este roteiro.";
  }

  if (!item && !loadError) notFound();
  if (!item) {
    return <ErrorState title="Não foi possível carregar este roteiro" description={loadError ?? undefined} />;
  }

  const structure = parseScriptStructure(item.script_structure);
  const text = resolveTeleprompterText(item, structure);

  return <TeleprompterView title={item.title} text={text} backHref={`/roteiros/${id}`} />;
}
