"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveGoal, removeGoal } from "@/lib/actions/metas";
import { GOAL_METRICS, GOAL_METRIC_LABELS, type DefaultGoalTargets, type GoalMetric } from "@/lib/metas";
import { getMonthEnd, getMonthStart, getWeekRange, todayISODate } from "@/lib/dates";
import type { Goal } from "@/types/domain";

interface GoalFormValues {
  periodType: "weekly" | "monthly";
  periodStart: string;
  periodEnd: string;
  metric: GoalMetric;
  targetValue: string;
  initialValue: string;
  notes: string;
}

function numberToInput(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

function defaultPeriod(periodType: "weekly" | "monthly"): { start: string; end: string } {
  const today = todayISODate();
  if (periodType === "weekly") {
    const { start, end } = getWeekRange(today);
    return { start, end };
  }
  return { start: getMonthStart(today), end: getMonthEnd(today) };
}

function GoalFormInner({
  goal,
  defaultMetric,
  defaultPeriodType,
  defaultTargets,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  goal: Goal | null;
  defaultMetric: GoalMetric;
  defaultPeriodType: "weekly" | "monthly";
  defaultTargets: Record<"weekly" | "monthly", DefaultGoalTargets>;
  onOpenChange: (open: boolean) => void;
  onSaved: (goal: Goal) => void;
  onDeleted?: (id: string) => void;
}) {
  const initialPeriod = goal
    ? { start: goal.period_start, end: goal.period_end }
    : defaultPeriod(defaultPeriodType);

  const { register, handleSubmit, watch, setValue, formState } = useForm<GoalFormValues>({
    defaultValues: {
      periodType: goal ? (goal.period_type as "weekly" | "monthly") : defaultPeriodType,
      periodStart: initialPeriod.start,
      periodEnd: initialPeriod.end,
      metric: goal ? (goal.metric as GoalMetric) : defaultMetric,
      targetValue: goal ? numberToInput(goal.target_value) : numberToInput(defaultTargets[defaultPeriodType]?.[defaultMetric] ?? null),
      initialValue: goal ? numberToInput(goal.initial_value) : "",
      notes: goal?.notes ?? "",
    },
  });
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const periodType = watch("periodType");
  const metric = watch("metric");
  const targetValue = watch("targetValue");

  function handlePeriodTypeChange(nextType: "weekly" | "monthly") {
    setValue("periodType", nextType);
    if (!goal) {
      const period = defaultPeriod(nextType);
      setValue("periodStart", period.start);
      setValue("periodEnd", period.end);
    }
  }

  function handleMetricChange(nextMetric: GoalMetric) {
    setValue("metric", nextMetric);
    if (!goal && targetValue === "") {
      const suggestion = defaultTargets[periodType]?.[nextMetric];
      if (typeof suggestion === "number") setValue("targetValue", String(suggestion));
    }
  }

  async function onSubmit(values: GoalFormValues) {
    setError(null);
    const result = await saveGoal(values, goal?.id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.goal);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!goal) return;
    setDeleting(true);
    setError(null);
    const result = await removeGoal(goal.id);
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDeleted?.(goal.id);
    onOpenChange(false);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-periodType">Tipo de período</Label>
          <Select id="goal-periodType" value={periodType} onChange={(e) => handlePeriodTypeChange(e.target.value as "weekly" | "monthly")}>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-metric">Métrica</Label>
          <Select id="goal-metric" value={metric} onChange={(e) => handleMetricChange(e.target.value as GoalMetric)}>
            {GOAL_METRICS.map((m) => (
              <option key={m} value={m}>
                {GOAL_METRIC_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-periodStart">Início</Label>
          <Input id="goal-periodStart" type="date" {...register("periodStart")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-periodEnd">Fim</Label>
          <Input id="goal-periodEnd" type="date" {...register("periodEnd")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-targetValue">Valor-alvo</Label>
          <Input id="goal-targetValue" type="number" min="0" step="0.01" inputMode="decimal" placeholder="—" {...register("targetValue")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-initialValue">Valor inicial (opcional)</Label>
          <Input id="goal-initialValue" type="number" min="0" step="0.01" inputMode="decimal" placeholder="—" {...register("initialValue")} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Sem valor inicial: métricas de fluxo (views, receita, etc.) partem de 0; seguidores parte da última leitura de perfil antes do início.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-notes">Observações</Label>
        <Textarea id="goal-notes" rows={2} {...register("notes")} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter className="sm:justify-between">
        {goal ? (
          <Button type="button" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" disabled={deleting} onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {deleting ? "Excluindo..." : "Excluir meta"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Salvando..." : "Salvar meta"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  defaultMetric?: GoalMetric;
  defaultPeriodType?: "weekly" | "monthly";
  defaultTargets: Record<"weekly" | "monthly", DefaultGoalTargets>;
  onSaved: (goal: Goal) => void;
  onDeleted?: (id: string) => void;
}

/** Diálogo de criar/editar/excluir uma meta semanal ou mensal. */
export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  defaultMetric = "conteudos_publicados",
  defaultPeriodType = "weekly",
  defaultTargets,
  onSaved,
  onDeleted,
}: GoalFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>Metas semanais ou mensais — o progresso é sempre recalculado a partir dos seus registros, nunca digitado à mão.</DialogDescription>
        </DialogHeader>
        {open ? (
          <GoalFormInner
            key={goal?.id ?? "new"}
            goal={goal ?? null}
            defaultMetric={defaultMetric}
            defaultPeriodType={defaultPeriodType}
            defaultTargets={defaultTargets}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
