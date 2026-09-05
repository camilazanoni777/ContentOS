"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveDefaultGoalTargets } from "@/lib/actions/metas";
import { GOAL_METRICS, GOAL_METRIC_LABELS, type DefaultGoalTargets } from "@/lib/metas";

interface DefaultGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTargets: Record<"weekly" | "monthly", DefaultGoalTargets>;
  onSaved: (periodType: "weekly" | "monthly", targets: DefaultGoalTargets) => void;
}

function targetsToInputs(targets: DefaultGoalTargets): Record<string, string> {
  const result: Record<string, string> = {};
  for (const metric of GOAL_METRICS) {
    result[metric] = typeof targets[metric] === "number" ? String(targets[metric]) : "";
  }
  return result;
}

/**
 * Formulário isolado, montado só enquanto o diálogo está aberto (mesmo
 * cuidado de ProfileSnapshotFormInner/GoalFormInner) — nasce sempre com o
 * estado certo direto do `useState` inicial, sem precisar de um efeito de
 * reset ao abrir.
 */
function DefaultGoalsFormInner({
  defaultTargets,
  onOpenChange,
  onSaved,
}: {
  defaultTargets: Record<"weekly" | "monthly", DefaultGoalTargets>;
  onOpenChange: (open: boolean) => void;
  onSaved: (periodType: "weekly" | "monthly", targets: DefaultGoalTargets) => void;
}) {
  const [periodType, setPeriodType] = React.useState<"weekly" | "monthly">("weekly");
  const [inputs, setInputs] = React.useState<Record<string, string>>(() => targetsToInputs(defaultTargets.weekly));
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function handlePeriodTypeChange(next: "weekly" | "monthly") {
    setPeriodType(next);
    setInputs(targetsToInputs(defaultTargets[next]));
  }

  async function handleSave() {
    setError(null);
    const targets: DefaultGoalTargets = {};
    for (const metric of GOAL_METRICS) {
      const raw = inputs[metric]?.trim();
      if (!raw) continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        setError(`Valor inválido em "${GOAL_METRIC_LABELS[metric]}" — use um número maior ou igual a zero.`);
        return;
      }
      targets[metric] = value;
    }
    setSaving(true);
    const result = await saveDefaultGoalTargets(periodType, targets);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(periodType, targets);
    onOpenChange(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="default-goals-period">Tipo de período</Label>
        <Select id="default-goals-period" value={periodType} onChange={(e) => handlePeriodTypeChange(e.target.value as "weekly" | "monthly")}>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GOAL_METRICS.map((metric) => (
          <div key={metric} className="flex flex-col gap-1">
            <Label htmlFor={`default-goal-${metric}`} className="text-xs">
              {GOAL_METRIC_LABELS[metric]}
            </Label>
            <Input
              id={`default-goal-${metric}`}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="—"
              value={inputs[metric] ?? ""}
              onChange={(e) => setInputs((prev) => ({ ...prev, [metric]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="button" disabled={saving} onClick={handleSave}>
          {saving ? "Salvando..." : "Salvar metas-padrão"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Metas-padrão: valores-alvo sugeridos por métrica, usados para pré-preencher
 * o valor-alvo ao criar uma meta nova daquele tipo de período (ver
 * GoalFormDialog). Guardado em app_settings.extra.default_goals — não é uma
 * tabela nova, mesmo padrão de performance_index_thresholds.
 */
export function DefaultGoalsDialog({ open, onOpenChange, defaultTargets, onSaved }: DefaultGoalsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Metas-padrão</DialogTitle>
          <DialogDescription>
            Valores-alvo sugeridos ao criar uma meta nova — deixe em branco para não sugerir nada nessa métrica.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <DefaultGoalsFormInner key={JSON.stringify(defaultTargets)} defaultTargets={defaultTargets} onOpenChange={onOpenChange} onSaved={onSaved} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
