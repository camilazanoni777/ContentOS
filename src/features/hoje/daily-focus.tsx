import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  MoonStar,
  SunMedium,
  Target,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateChecklistCompletion } from "@/lib/checklist";
import { CONTENT_STATUS_ROUTE } from "@/lib/content-status-meta";
import type { CheckinPriority, ContentItem, DailyAction, Goal } from "@/types/domain";

interface DailyFocusProps {
  todayObjective: string | null;
  priorities: CheckinPriority[];
  contentById: Map<string, ContentItem>;
  goalById: Map<string, Goal>;
  monthlyGoal: Goal | null;
  actions: DailyAction[];
  hasCheckin: boolean;
  nightClosed: boolean;
  nightClosedAt: string | null;
}

export function DailyFocus({
  todayObjective,
  priorities,
  contentById,
  goalById,
  monthlyGoal,
  actions,
  hasCheckin,
  nightClosed,
  nightClosedAt,
}: DailyFocusProps) {
  const { active, done, percent } = calculateChecklistCompletion(actions);

  return (
    <Card variant="highlight" className="overflow-hidden border-primary/25 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-primary/15 bg-card/60 p-5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="font-sans text-base font-bold tracking-tight text-foreground">
              Foco e Prioridades do Dia
            </CardTitle>
            <p className="text-2xs text-muted-foreground">
              Alinhamento de intenção e ritmo de execução diário
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {nightClosed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-tone-success-fg/20 bg-tone-success-bg px-2.5 py-1 text-xs font-semibold text-tone-success-fg">
            <MoonStar className="h-3.5 w-3.5" aria-hidden="true" />
            Dia concluído {nightClosedAt ? `(${new Date(nightClosedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})` : ""}
          </span>
        ) : hasCheckin ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
            <SunMedium className="h-3.5 w-3.5" aria-hidden="true" />
            Check-in ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Check-in pendente
          </span>
        )}
      </CardHeader>

      <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
        {/* Coluna Principal: Objetivo & Prioridades (7 colunas no desktop) */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-7">
          {/* Objetivo do Dia */}
          <div className="space-y-2">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Objetivo Principal de Hoje
            </span>
            {todayObjective ? (
              <p className="rounded-xl border border-primary/20 bg-card p-3.5 font-medium text-foreground text-sm sm:text-base leading-snug shadow-2xs">
                “{todayObjective}”
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                Nenhum objetivo definido ainda para hoje. Faça o check-in para guiar seu dia.
              </div>
            )}
          </div>

          {/* Lista de até 3 Prioridades */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prioridades Registradas ({priorities.length}/3)
              </span>
              <Link
                href="/checkin"
                className="text-2xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                Editar no check-in
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {priorities.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma prioridade listada ainda hoje.
              </p>
            ) : (
              <ol className="space-y-2">
                {priorities.map((priority, index) => {
                  const linkedContent = priority.contentItemId ? contentById.get(priority.contentItemId) : null;
                  const linkedGoal = priority.goalId ? goalById.get(priority.goalId) : null;

                  return (
                    <li
                      key={`${priority.label}-${index}`}
                      className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-card p-2.5 text-xs shadow-2xs"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-2xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-foreground leading-tight">
                          {priority.label}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-2xs">
                          {linkedContent ? (
                            <Link
                              href={CONTENT_STATUS_ROUTE[linkedContent.status]}
                              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Etapa: {linkedContent.title}
                            </Link>
                          ) : null}
                          {linkedGoal ? (
                            <Link
                              href="/metas"
                              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                              <Target className="h-3 w-3" />
                              Meta: {linkedGoal.metric}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Coluna Lateral: Checklist de Execução & Ações Rápidas (5 colunas no desktop) */}
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-border/80 bg-card p-4 sm:p-5 lg:col-span-5">
          {/* Checklist de Execução */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Checklist do Dia
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                {percent === null ? "Sem tarefas" : `${done}/${active} (${percent}%)`}
              </span>
            </div>

            {percent !== null ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {nightClosed
                ? "Fechamento do dia concluído com sucesso. Bom descanso!"
                : percent === 100
                  ? "Todas as tarefas ativas de hoje foram cumpridas! Pronto para o fechamento."
                  : hasCheckin
                    ? "Marque as tarefas no check-in conforme avançar na produção."
                    : "Inicie o check-in para ativar as tarefas operacionais de hoje."}
            </p>
          </div>

          {/* Meta do Mês */}
          {monthlyGoal ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Meta do Mês
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium text-foreground">{monthlyGoal.metric}</span>
                {monthlyGoal.target_value !== null ? (
                  <span className="text-2xs text-primary font-semibold">
                    Alvo: {monthlyGoal.target_value}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* CTA de Ação Direta */}
          <div className="pt-2">
            {!hasCheckin ? (
              <Button asChild size="default" className="w-full gap-2 shadow-xs">
                <Link href="/checkin">
                  <SunMedium className="h-4 w-4" />
                  <span>Fazer Check-in do Dia</span>
                </Link>
              </Button>
            ) : !nightClosed ? (
              <Button asChild variant="outline" size="default" className="w-full gap-2 border-primary/30 hover:bg-secondary">
                <Link href="/checkin">
                  <MoonStar className="h-4 w-4 text-primary" />
                  <span>Continuar Check-in / Fechamento</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="default" className="w-full gap-2 text-muted-foreground">
                <Link href="/checkin">
                  <CheckCircle2 className="h-4 w-4 text-tone-success-fg" />
                  <span>Ver Resumo do Check-in</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
