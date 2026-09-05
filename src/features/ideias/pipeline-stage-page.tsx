import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/layout/priority-badge";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listContentItems } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { ContentStatus } from "@/types/domain";

interface PipelineStagePageProps {
  title: string;
  description: string;
  statuses: ContentStatus[];
  emptyTitle: string;
  emptyDescription: string;
}

export async function PipelineStagePage({ title, description, statuses, emptyTitle, emptyDescription }: PipelineStagePageProps) {
  let supabase;
  try { supabase = await createClient(); } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/ideias");

  let items = null;
  let loadError: string | null = null;
  try { items = await listContentItems(supabase, { status: statuses }); }
  catch (error) { loadError = error instanceof DataAccessError ? error.message : `Não foi possível carregar ${title}.`; }

  if (!items) return <ErrorState title={`Não foi possível carregar ${title}`} description={loadError ?? undefined} />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} actions={<Button asChild variant="outline"><Link href="/ideias">Abrir Banco de ideias</Link></Button>} />
      {items.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-3 p-5 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><CardTitle className="font-serif text-title">{item.title}</CardTitle><StatusBadge status={item.status} /></div>
                {item.hook ? <p className="text-sm text-muted-foreground line-clamp-3">{item.hook}</p> : null}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2 p-5 pt-0"><PriorityBadge priority={item.priority} />{item.pillar ? <span className="text-xs text-muted-foreground">{item.pillar}</span> : null}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
