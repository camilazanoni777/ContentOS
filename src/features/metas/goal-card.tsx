"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toneClasses } from "@/lib/tone-classes";
import { GOAL_METRIC_LABELS, GOAL_STATUS_LABELS, type GoalComputed } from "@/lib/metas";
import { GOAL_STATUS_META } from "./goal-status-meta";
import { cn } from "@/lib/utils";

function formatValue(value: number | null, metric: string): string {
  if (value === null) return "—";
  if (metric === "receita") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

const PROGRESS_BAR_COLOR: Record<GoalComputed["status"], string> = {
  not_started: "bg-tone-neutral-fg",
  in_progress: "bg-tone-info-fg",
  on_pace: "bg-tone-progress-fg",
  at_risk: "bg-tone-warning-fg",
  achieved: "bg-tone-success-fg",
  exceeded: "bg-tone-success-fg",
};

export function GoalCard({ computed, onEdit }: { computed: GoalComputed; onEdit: () => void }) {
  const { goal, currentValue, missing, progressPercent, elapsedPercent, daysRemaining, status } = computed;
  const meta = GOAL_STATUS_META[status];
  const Icon = meta.icon;
  const metricLabel = GOAL_METRIC_LABELS[goal.metric as keyof typeof GOAL_METRIC_LABELS] ?? goal.metric;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{metricLabel}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {goal.period_start} a {goal.period_end} · {goal.period_type === "weekly" ? "Semanal" : "Mensal"}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Editar
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", toneClasses(meta.tone))}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {GOAL_STATUS_LABELS[status]}
        </span>

        <Progress value={progressPercent ?? 0} indicatorClassName={PROGRESS_BAR_COLOR[status]} />

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">Atual</span>
          <span className="text-right font-medium">{formatValue(currentValue, goal.metric)}</span>
          <span className="text-muted-foreground">Alvo</span>
          <span className="text-right font-medium">{formatValue(goal.target_value, goal.metric)}</span>
          <span className="text-muted-foreground">Falta</span>
          <span className="text-right font-medium">{formatValue(missing, goal.metric)}</span>
          <span className="text-muted-foreground">Progresso</span>
          <span className="text-right font-medium">{progressPercent === null ? "—" : `${progressPercent.toFixed(0)}%`}</span>
          <span className="text-muted-foreground">Tempo decorrido</span>
          <span className="text-right font-medium">{elapsedPercent.toFixed(0)}%</span>
          <span className="text-muted-foreground">Dias restantes</span>
          <span className="text-right font-medium">{daysRemaining}</span>
        </div>

        {goal.notes ? <p className="text-xs text-muted-foreground">{goal.notes}</p> : null}
      </CardContent>
    </Card>
  );
}
