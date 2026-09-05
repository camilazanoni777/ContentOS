import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/layout/priority-badge";
import { StatusBadge } from "@/components/layout/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignAssociationBadge } from "@/features/negocio/campaign-association-badge";
import { listContentItems } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { formatDuration, parseScriptChecklist, scriptChecklistProgress } from "@/lib/script-workspace";
import { createClient } from "@/lib/supabase/server";
import { CONTENT_STATUS_LABELS } from "@/types/domain";
import type { ContentItem, ContentStatus } from "@/types/domain";

const ROTEIROS_STATUSES: ContentStatus[] = ["researching", "scripting", "ready_to_record"];

/**
 * Página Roteiros: lista os conteúdos em pesquisa, roteirização ou prontos
 * para gravar — sempre lendo de content_items (nunca uma tabela própria).
 * Cada card abre o workspace de roteirização (/roteiros/[id]).
 */
export async function RoteirosList() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/roteiros");

  let items: ContentItem[] | null = null;
  let loadError: string | null = null;
  try {
    items = await listContentItems(supabase, { status: ROTEIROS_STATUSES });
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar Roteiros.";
  }

  if (!items) {
    return <ErrorState title="Não foi possível carregar Roteiros" description={loadError ?? undefined} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Roteiros" description="Ideias em pesquisa, roteirização ou já prontas para gravar." />
      {items.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo em roteirização"
          description="Avance uma ideia no Banco para Pesquisa ou Roteiro."
        />
      ) : (
        ROTEIROS_STATUSES.map((status) => {
          const group = items!.filter((item) => item.status === status);
          if (group.length === 0) return null;
          return (
            <section key={status} className="flex flex-col gap-3">
              <h2 className="font-serif text-lg text-foreground">
                {CONTENT_STATUS_LABELS[status]} <span className="font-sans text-sm text-muted-foreground">({group.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.map((item) => {
                  const checklist = parseScriptChecklist(item.script_checklist);
                  const progress = scriptChecklistProgress(checklist);
                  const duration = formatDuration(item.estimated_duration_seconds);
                  return (
                    <Link
                      key={item.id}
                      href={`/roteiros/${item.id}`}
                      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Card className="h-full transition-colors hover:border-primary/50">
                        <CardHeader className="gap-3 p-5 pb-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="font-serif text-title">{item.title}</CardTitle>
                            <CampaignAssociationBadge campaignId={item.campaign_id} />
                            <StatusBadge status={item.status} />
                          </div>
                          {item.hook ? (
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.hook}</p>
                          ) : (
                            <p className="text-sm italic text-muted-foreground">Sem gancho escolhido ainda.</p>
                          )}
                        </CardHeader>
                        <CardContent className="flex flex-wrap items-center gap-2 p-5 pt-0 text-xs text-muted-foreground">
                          <PriorityBadge priority={item.priority} />
                          {item.pillar ? <span>{item.pillar}</span> : null}
                          <span>
                            Checklist {progress.checked}/{progress.total}
                          </span>
                          {duration ? <span>{duration} min</span> : null}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
