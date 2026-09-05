import { AlertTriangle, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { toneClasses } from "@/lib/tone-classes";
import {
  PERFORMANCE_TIER_LABELS,
  type BaselineScope,
  type PerformanceIndexResult,
  type PerformanceTierThresholds,
} from "@/lib/metricas";

const BASELINE_SCOPE_LABELS: Record<BaselineScope, string> = {
  account_format: "mesmo formato, nesta conta",
  account: "todos os formatos desta conta",
  global: "toda a base histórica",
};

const TIER_TONE = {
  below_average: "warning",
  average: "neutral",
  above_average: "success",
  viral: "progress",
} as const;

const TIER_BAR_CLASS = {
  below_average: "bg-tone-warning-fg",
  average: "bg-tone-neutral-fg",
  above_average: "bg-tone-success-fg",
  viral: "bg-tone-progress-fg",
} as const;

function tierForScore(score: number, thresholds?: PerformanceTierThresholds): keyof typeof TIER_BAR_CLASS {
  const t = thresholds ?? { averageMin: 70, aboveAverageMin: 120, viralMin: 300 };
  if (score >= t.viralMin) return "viral";
  if (score >= t.aboveAverageMin) return "above_average";
  if (score >= t.averageMin) return "average";
  return "below_average";
}

/** Badge do índice de performance — número + faixa (nunca só a cor, sempre com texto). */
export function PerformanceIndexBadge({ result, className }: { result: PerformanceIndexResult; className?: string }) {
  if (result.state !== "ok" || result.index === null || !result.tier) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-tone-neutral-bg px-2 py-1 text-xs font-medium text-tone-neutral-fg",
          className,
        )}
      >
        <HelpCircle className="h-3 w-3" aria-hidden="true" />
        {result.state === "no_capture" ? "Sem captura" : "Sem base histórica"}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses(TIER_TONE[result.tier]),
        className,
      )}
    >
      {result.index} · {PERFORMANCE_TIER_LABELS[result.tier]}
    </span>
  );
}

/**
 * Explicação visual de como o índice foi formado — nunca uma caixa-preta:
 * mostra, componente a componente, o valor bruto, a média comparável (e
 * com quem foi comparado), a razão (limitada a 3x) e quanto cada um
 * contribuiu para a nota final depois da redistribuição de pesos dos
 * componentes indisponíveis.
 */
export function PerformanceIndexBreakdown({
  result,
  thresholds,
}: {
  result: PerformanceIndexResult;
  thresholds?: PerformanceTierThresholds;
}) {
  if (result.state === "no_capture") {
    return (
      <p className="flex items-start gap-1.5 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tone-warning-fg" aria-hidden="true" />
        Sem captura de métricas nesta janela ainda — registre uma leitura para calcular o índice de performance.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {result.state === "insufficient_data" ? (
        <p className="flex items-start gap-1.5 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tone-warning-fg" aria-hidden="true" />
          Ainda não há base histórica comparável suficiente (mesmo formato/conta, ou toda a base) para calcular um índice —
          faltam conteúdos publicados comparáveis com esse componente medido. Os valores brutos abaixo já foram capturados.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <PerformanceIndexBadge result={result} />
          <span className="text-xs text-muted-foreground">100 = igual à média histórica comparável</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {result.breakdown.map((component) => {
          const isCapped = Boolean(
            component.available && component.value !== null && component.baseline && component.value / component.baseline.average > 3,
          );
          return (
            <div key={component.key} className="flex flex-col gap-1 rounded-lg border border-border p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{component.label}</span>
                {component.available ? (
                  <span className="text-xs text-muted-foreground">
                    peso {Math.round((component.redistributedWeight ?? component.weight) * 100)}%
                    {component.redistributedWeight && Math.abs(component.redistributedWeight - component.weight) > 0.001
                      ? ` (redistribuído de ${Math.round(component.weight * 100)}%)`
                      : ""}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-tone-warning-fg">
                    {component.unavailableReason === "missing_value" ? "sem valor informado" : "sem base histórica"}
                  </span>
                )}
              </div>
              {component.available && component.score !== null ? (
                <>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full", TIER_BAR_CLASS[tierForScore(component.score, thresholds)])}
                      style={{ width: `${Math.min(component.score, 300) / 3}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {component.value?.toFixed(2)}% vs. média de {component.baseline?.average.toFixed(2)}% (
                    {component.baseline ? BASELINE_SCOPE_LABELS[component.baseline.scope] : ""}, {component.baseline?.sampleSize}{" "}
                    conteúdos) — nota {Math.round(component.score)}
                    {isCapped ? " (limitada a 3x a média)" : ""}
                  </p>
                </>
              ) : component.value !== null ? (
                <p className="text-xs text-muted-foreground">Valor bruto: {component.value.toFixed(2)}% — sem média comparável ainda.</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
