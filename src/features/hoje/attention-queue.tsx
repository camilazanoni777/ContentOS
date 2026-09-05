import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTENT_STATUS_ROUTE } from "@/lib/content-status-meta";
import type { HojeActionableItem } from "@/lib/data/hoje";

interface AttentionQueueProps {
  items: HojeActionableItem[];
}

export function AttentionQueue({ items }: AttentionQueueProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-tone-warning-fg" aria-hidden="true" />
          <CardTitle className="font-sans text-base font-bold tracking-tight text-foreground">
            Fila de Atenção
          </CardTitle>
        </div>
        <span
          className={`text-xs font-semibold ${
            items.length > 0 ? "text-destructive" : "text-tone-success-fg"
          }`}
        >
          {items.length === 0 ? "Zero pendências" : `${items.length} urgente${items.length > 1 ? "s" : ""}`}
        </span>
      </CardHeader>

      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tone-success-bg text-tone-success-fg shadow-2xs">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-sans text-sm font-bold text-foreground">Tudo em dia!</p>
              <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                Nenhum conteúdo com prazo vencido nem métricas pendentes de leitura no momento.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item) => {
              const isOverdue = item.type === "atrasado";
              const href = isOverdue
                ? item.status
                  ? CONTENT_STATUS_ROUTE[item.status]
                  : "/ideias"
                : "/metricas/conteudos";

              return (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${
                          isOverdue
                            ? "bg-destructive/10 text-destructive"
                            : "bg-tone-warning-bg text-tone-warning-fg"
                        }`}
                      >
                        {isOverdue ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Atrasado
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-3 w-3" />
                            Métricas pendentes
                          </>
                        )}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center">
                    <Button asChild size="sm" variant="ghost" className="h-8 gap-1 text-xs text-primary hover:bg-secondary">
                      <Link href={href}>
                        <span>Resolver</span>
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
