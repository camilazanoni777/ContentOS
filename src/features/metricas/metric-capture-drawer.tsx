"use client";

import * as React from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { FormDrawer } from "@/components/layout/form-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { removeMetricSnapshot, saveMetricSnapshot } from "@/lib/actions/metricas";
import { toDateTimeLocalInput } from "@/lib/dates";
import {
  emptyMetricSnapshotFormValues,
  metricSnapshotToFormValues,
  QUICK_CAPTURE_FIELDS,
  type MetricSnapshotFormValues,
} from "./metric-snapshot-form-types";
import { METRIC_WINDOW_LABELS, type MetricSnapshot, type MetricWindow } from "@/types/domain";

interface FieldSpec {
  name: keyof MetricSnapshotFormValues;
  label: string;
  step?: string;
}

const RECEITA_E_CONVERSAO: FieldSpec[] = [
  { name: "profileVisits", label: "Visitas ao perfil" },
  { name: "leads", label: "Leads" },
  { name: "sales", label: "Vendas" },
  { name: "revenue", label: "Receita (R$)", step: "0.01" },
];

const ALCANCE_E_VISUALIZACOES: FieldSpec[] = [
  { name: "views", label: "Views" },
  { name: "reach", label: "Alcance" },
  { name: "impressions", label: "Impressões" },
];

const ENGAJAMENTO: FieldSpec[] = [
  { name: "likes", label: "Curtidas" },
  { name: "comments", label: "Comentários" },
  { name: "shares", label: "Compartilhamentos" },
  { name: "saves", label: "Salvamentos" },
  { name: "replies", label: "Respostas" },
];

const CONVERSAO: FieldSpec[] = [
  { name: "followersGained", label: "Seguidores gerados" },
  { name: "linkClicks", label: "Cliques" },
];

const VIDEO_E_RETENCAO: FieldSpec[] = [
  { name: "averageWatchTimeSeconds", label: "Tempo médio assistido (s)", step: "0.1" },
  { name: "videoDurationSeconds", label: "Duração do vídeo (s)", step: "0.1" },
  { name: "threeSecondViews", label: "Views de 3 segundos" },
  { name: "completedViews", label: "Views completas" },
  { name: "retentionRate", label: "Retenção informada (%)", step: "0.1" },
];

const STORIES: FieldSpec[] = [
  { name: "storyExits", label: "Saídas de stories" },
  { name: "tapsForward", label: "Toques para avançar" },
  { name: "tapsBack", label: "Toques para voltar" },
];

function NumberField({
  field,
  register,
}: {
  field: FieldSpec;
  register: UseFormRegister<MetricSnapshotFormValues>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={`metric-${field.name}`} className="text-xs">
        {field.label}
      </Label>
      <Input
        id={`metric-${field.name}`}
        type="number"
        min="0"
        step={field.step ?? "1"}
        inputMode="decimal"
        placeholder="—"
        {...register(field.name)}
      />
    </div>
  );
}

function Fieldset({
  legend,
  fields,
  register,
}: {
  legend: string;
  fields: FieldSpec[];
  register: UseFormRegister<MetricSnapshotFormValues>;
}) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <NumberField key={field.name} field={field} register={register} />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Formulário isolado num componente próprio, montado só enquanto o drawer
 * está aberto — nasce sempre com valores/erro limpos sem precisar de um
 * efeito de reset (mesmo cuidado de MarkAsPublishedFormInner). Remontado
 * (via `key`) sempre que a janela selecionada muda, para carregar os
 * valores certos (ver MetricCaptureDrawer).
 */
function MetricCaptureFormInner({
  contentItemId,
  windowType,
  existing,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  contentItemId: string;
  windowType: MetricWindow;
  existing: MetricSnapshot | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (snapshot: MetricSnapshot) => void;
  onDeleted: (id: string) => void;
}) {
  const [mode, setMode] = React.useState<"quick" | "full">("quick");
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const defaultValues = React.useMemo<MetricSnapshotFormValues>(() => {
    if (existing) {
      return metricSnapshotToFormValues(
        existing,
        toDateTimeLocalInput(existing.window_start),
        toDateTimeLocalInput(existing.window_end),
        toDateTimeLocalInput(existing.captured_at),
      );
    }
    return emptyMetricSnapshotFormValues(windowType, toDateTimeLocalInput(new Date().toISOString()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<MetricSnapshotFormValues>({
    defaultValues,
  });

  // Validação acontece no servidor (metricSnapshotSchema, via saveMetricSnapshot) —
  // mesmo padrão de MarkAsPublishedDialog: um schema com vários transforms
  // condicionais (janela custom, números opcionais) não bate exatamente com
  // o tipo do formulário (todos os campos string, obrigatórios) exigido por
  // zodResolver, então validamos ao enviar e mostramos o erro devolvido.
  async function onSubmit(values: MetricSnapshotFormValues) {
    setError(null);
    const result = await saveMetricSnapshot(contentItemId, values, existing?.id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.snapshot);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    setError(null);
    const result = await removeMetricSnapshot(contentItemId, existing.id);
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDeleted(existing.id);
    onOpenChange(false);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Campo em branco fica sem valor — nunca vira zero. Complete o que você já tem agora e volte depois para o resto.
        </p>
        <div className="flex shrink-0 gap-1 rounded-md border border-input p-0.5">
          <Button type="button" size="sm" variant={mode === "quick" ? "default" : "ghost"} onClick={() => setMode("quick")}>
            Rápido
          </Button>
          <Button type="button" size="sm" variant={mode === "full" ? "default" : "ghost"} onClick={() => setMode("full")}>
            Completo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="metric-capturedAt" className="text-xs">
            Capturado em
          </Label>
          <Input id="metric-capturedAt" type="datetime-local" {...register("capturedAt")} />
        </div>
        {windowType === "custom" ? (
          <>
            <div className="flex flex-col gap-1">
              <Label htmlFor="metric-windowStart" className="text-xs">
                Início do período
              </Label>
              <Input id="metric-windowStart" type="datetime-local" {...register("windowStart")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="metric-windowEnd" className="text-xs">
                Fim do período
              </Label>
              <Input id="metric-windowEnd" type="datetime-local" {...register("windowEnd")} />
            </div>
          </>
        ) : null}
      </div>

      {mode === "quick" ? (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Essencial</legend>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_CAPTURE_FIELDS.map((name) => {
              const spec = [
                ...ALCANCE_E_VISUALIZACOES,
                ...ENGAJAMENTO,
                ...CONVERSAO,
              ].find((field) => field.name === name)!;
              return <NumberField key={name} field={spec} register={register} />;
            })}
          </div>
        </fieldset>
      ) : (
        <>
          <Fieldset legend="Alcance e visualizações" fields={ALCANCE_E_VISUALIZACOES} register={register} />
          <Fieldset legend="Engajamento" fields={ENGAJAMENTO} register={register} />
          <Fieldset legend="Perfil e conversão" fields={[...CONVERSAO, ...RECEITA_E_CONVERSAO]} register={register} />
          <Fieldset legend="Vídeo e retenção" fields={VIDEO_E_RETENCAO} register={register} />
          <Fieldset legend="Stories" fields={STORIES} register={register} />
        </>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="mt-auto flex items-center justify-between gap-2">
        {existing ? (
          <Button type="button" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" disabled={deleting} onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {deleting ? "Excluindo..." : "Excluir captura"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar captura"}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface MetricCaptureDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentItemId: string;
  /** Todas as leituras já registradas para este conteúdo — usadas para pré-preencher ao trocar de janela. */
  snapshots: MetricSnapshot[];
  /** Quando definido, abre já editando esta captura específica (usada para editar uma leitura "custom" existente, que não é upsertável por janela — ver saveMetricSnapshot). */
  editSnapshot?: MetricSnapshot | null;
  onSaved: (snapshot: MetricSnapshot) => void;
  onDeleted: (id: string) => void;
}

/** Drawer de captura de métricas — janela (24h/7d/30d/personalizada) + formulário rápido/completo. */
export function MetricCaptureDrawer({
  open,
  onOpenChange,
  contentItemId,
  snapshots,
  editSnapshot,
  onSaved,
  onDeleted,
}: MetricCaptureDrawerProps) {
  const [windowType, setWindowType] = React.useState<MetricWindow>(editSnapshot?.window_type ?? "7d");
  const canChangeWindow = !editSnapshot;
  const existing = editSnapshot ?? (windowType === "custom" ? null : snapshots.find((s) => s.window_type === windowType) ?? null);

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar métricas"
      description="Views, alcance, engajamento, conversão e retenção de uma leitura — 24h, 7 dias, 30 dias ou um período personalizado."
    >
      {open ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="metric-window-type" className="text-xs">
              Janela desta leitura
            </Label>
            <Select
              id="metric-window-type"
              value={windowType}
              disabled={!canChangeWindow}
              onChange={(event) => setWindowType(event.target.value as MetricWindow)}
            >
              {(Object.keys(METRIC_WINDOW_LABELS) as MetricWindow[]).map((window) => (
                <option key={window} value={window}>
                  {METRIC_WINDOW_LABELS[window]}
                </option>
              ))}
            </Select>
            {windowType !== "custom" ? (
              <p className="text-xs text-muted-foreground">
                {existing ? "Já existe uma leitura nesta janela — editando." : "Ainda não há leitura nesta janela para este conteúdo."}
              </p>
            ) : null}
          </div>
          <MetricCaptureFormInner
            key={`${windowType}-${existing?.id ?? "new"}`}
            contentItemId={contentItemId}
            windowType={windowType}
            existing={existing}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        </div>
      ) : null}
    </FormDrawer>
  );
}
