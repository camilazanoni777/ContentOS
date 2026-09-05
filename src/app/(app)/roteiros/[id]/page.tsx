import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { getContentItemById } from "@/lib/data/content-items";
import { listScriptVersions } from "@/lib/data/script-versions";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { ScriptWorkspace } from "@/features/roteiros/script-workspace";

export const metadata: Metadata = { title: "Roteiro — Cami Content OS" };

async function loadScriptWorkspaceData(supabase: DbClient, id: string) {
  const [item, versions] = await Promise.all([
    getContentItemById(supabase, id),
    listScriptVersions(supabase, id, 15),
  ]);
  return { item, versions };
}

export default async function RoteiroWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
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
  if (!user) redirect(`/login?proximo=/roteiros/${id}`);

  let data: Awaited<ReturnType<typeof loadScriptWorkspaceData>> | null = null;
  let loadError: string | null = null;
  try {
    data = await loadScriptWorkspaceData(supabase, id);
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar este roteiro.";
  }

  if (!data) {
    return <ErrorState title="Não foi possível carregar este roteiro" description={loadError ?? undefined} />;
  }
  if (!data.item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.item.title}
        description="Workspace de roteirização — briefing, ganchos, roteiro, estrutura e checklist."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={data.item.status} />
            <Button asChild variant="outline">
              <Link href="/roteiros">Voltar para Roteiros</Link>
            </Button>
          </div>
        }
      />
      <ScriptWorkspace item={data.item} versions={data.versions} />
    </div>
  );
}
