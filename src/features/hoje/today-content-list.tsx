import Link from "next/link";
import { CalendarDays, ArrowRight, Video, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/layout/status-badge";
import { EmptyState } from "@/components/feedback/states";
import { CONTENT_STATUS_ROUTE } from "@/lib/content-status-meta";
import type { ContentItem, ContentStatus } from "@/types/domain";

interface TodayContentListProps {
  items: ContentItem[];
}

function getContextualAction(status: ContentStatus, id: string): { label: string; href: string } {
  switch (status) {
    case "idea":
    case "researching":
      return { label: "Roteirizar", href: "/roteiros" };
    case "scripting":
      return { label: "Editar roteiro", href: `/roteiros/${id}` };
    case "ready_to_record":
      return { label: "Gravar agora", href: `/gravacao?item=${id}` };
    case "recorded":
      return { label: "Enviar p/ edição", href: "/edicao" };
    case "editing":
      return { label: "Revisar corte", href: `/edicao/${id}` };
    case "awaiting_approval":
      return { label: "Aprovar agendamento", href: "/agendamento" };
    case "scheduled":
      return { label: "Ver agendamento", href: "/agendamento" };
    case "published":
      return { label: "Registrar métricas", href: "/metricas/conteudos" };
    default:
      return { label: "Abrir", href: "/ideias" };
  }
}

export function TodayContentList({ items }: TodayContentListProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="font-sans text-base font-bold tracking-tight text-foreground">
            Hoje na Pauta
          </CardTitle>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {items.length} {items.length === 1 ? "conteúdo" : "conteúdos"}
        </span>
      </CardHeader>

      <CardContent className="flex-1">
        {items.length === 0 ? (
          <EmptyState
            title="Nada na pauta para hoje"
            description="Nenhum conteúdo com agendamento ou gravação marcada para hoje. Você pode puxar uma ideia do banco ou planejar um novo post."
            className="py-10"
            action={
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/ideias">Banco de Ideias</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/calendario">Ver Calendário</Link>
                </Button>
              </div>
            }
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item) => {
              const action = getContextualAction(item.status, item.id);
              const route = CONTENT_STATUS_ROUTE[item.status];

              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={route}
                        className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {item.title}
                      </Link>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-2xs text-muted-foreground">
                      {item.format ? (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 capitalize">
                          <Video className="h-2.5 w-2.5" />
                          {item.format}
                        </span>
                      ) : null}
                      {item.pillar ? (
                        <span className="inline-flex items-center gap-1 rounded bg-secondary/70 px-1.5 py-0.5 text-primary">
                          <Layers className="h-2.5 w-2.5" />
                          {item.pillar}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                      <Link href={action.href}>
                        <span>{action.label}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
