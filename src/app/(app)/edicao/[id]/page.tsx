import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { getContentItemById } from "@/lib/data/content-items";
import { listReviewComments } from "@/lib/data/content-review-comments";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { EdicaoWorkspace } from "@/features/edicao/edicao-workspace";

export const metadata: Metadata = { title: "Edição — Cami Content OS" };

async function loadEdicaoWorkspaceData(supabase: DbClient, id: string) {
  const [item, comments] = await Promise.all([
    getContentItemById(supabase, id),
    listReviewComments(supabase, id),
  ]);
  return { item, comments };
}

export default async function EdicaoWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
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
  if (!user) redirect(`/login?proximo=/edicao/${id}`);

  let data: Awaited<ReturnType<typeof loadEdicaoWorkspaceData>> | null = null;
  let loadError: string | null = null;
  try {
    data = await loadEdicaoWorkspaceData(supabase, id);
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar esta edição.";
  }

  if (!data) {
    return <ErrorState title="Não foi possível carregar esta edição" description={loadError ?? undefined} />;
  }
  if (!data.item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.item.title}
        description="Workspace de edição — arquivos, instruções, checklist de qualidade e comentários."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={data.item.status} />
            <Button asChild variant="outline">
              <Link href="/edicao">Voltar para Edição</Link>
            </Button>
          </div>
        }
      />
      <EdicaoWorkspace item={data.item} comments={data.comments} />
    </div>
  );
}
