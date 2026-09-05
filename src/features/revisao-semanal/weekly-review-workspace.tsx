"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { SaveStatusIndicator } from "@/components/feedback/save-status-indicator";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import { saveWeeklyReview, markWeeklyReviewComplete } from "@/lib/actions/revisao-semanal";
import { addDaysISO, formatDateBR } from "@/lib/dates";
import { FORMAT_LABELS } from "@/lib/content-pipeline";
import {
  WEEKDAY_LABELS,
  buildAutoSummary,
  type WeekComparison,
  type WeekHighlights,
  type WeekStats,
} from "@/lib/revisao-semanal";
import type { WeeklyReview } from "@/types/domain";
import { EMPTY_WEEKLY_REVIEW_FORM_VALUES, type WeeklyReviewFormValues } from "./weekly-review-form-types";

interface WeeklyReviewWorkspaceProps {
  weekStart: string;
  weekEnd: string;
  review: WeeklyReview | null;
  comparison: WeekComparison;
  highlights: WeekHighlights;
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function formatCurrency(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(0)}%`;
}

function formatDelta(value: number | null, formatter: (v: number | null) => string): string | null {
  if (value === null || value === 0) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatter(value).replace(/^-/, "-")} vs. semana passada`;
}

function toDefaultValues(review: WeeklyReview | null): WeeklyReviewFormValues {
  return {
    whatWorked: review?.what_worked ?? "",
    whatDidntWork: review?.what_didnt_work ?? "",
    whatToRepeat: review?.what_to_repeat ?? "",
    whatToStop: review?.what_to_stop ?? "",
    whatToTest: review?.what_to_test ?? "",
    keyLearning: review?.key_learning ?? "",
    decision: review?.decision ?? "",
  };
}

const STAT_ROWS: { key: keyof WeekStats; label: string; formatter: (v: number | null) => string }[] = [
  { key: "plannedCount", label: "Planejados", formatter: formatNumber },
  { key: "publishedCount", label: "Publicados", formatter: formatNumber },
  { key: "executionPercent", label: "% de execução", formatter: formatPercent },
  { key: "views", label: "Views", formatter: formatNumber },
  { key: "reach", label: "Alcance", formatter: formatNumber },
  { key: "totalEngagement", label: "Engajamento total", formatter: formatNumber },
  { key: "engagementRate", label: "Taxa de engajamento", formatter: (v) => (v === null ? "—" : `${v.toFixed(1)}%`) },
  { key: "shares", label: "Compartilhamentos", formatter: formatNumber },
  { key: "saves", label: "Salvamentos", formatter: formatNumber },
  { key: "followersGained", label: "Seguidores ganhos", formatter: formatNumber },
  { key: "profileVisits", label: "Visitas ao perfil", formatter: formatNumber },
  { key: "websiteClicks", label: "Cliques no link", formatter: formatNumber },
  { key: "leads", label: "Leads", formatter: formatNumber },
  { key: "sales", label: "Vendas", formatter: formatNumber },
  { key: "revenue", label: "Receita", formatter: formatCurrency },
  { key: "hoursInvested", label: "Horas investidas", formatter: formatNumber },
  { key: "resultPerHour", label: "Resultado por hora", formatter: formatCurrency },
];

export function WeeklyReviewWorkspace({ weekStart, weekEnd, review, comparison, highlights }: WeeklyReviewWorkspaceProps) {
  const { register, watch, getValues } = useForm<WeeklyReviewFormValues>({
    defaultValues: review ? toDefaultValues(review) : EMPTY_WEEKLY_REVIEW_FORM_VALUES,
  });
  const values = watch();

  const { status, savedAt, error, retry } = useAutosave({
    value: values,
    save: (current) => saveWeeklyReview(weekStart, current),
  });

  const [completing, setCompleting] = React.useState(false);
  const [completeError, setCompleteError] = React.useState<string | null>(null);

  const previousWeek = addDaysISO(weekStart, -7);
  const nextWeek = addDaysISO(weekStart, 7);
  const autoSummary = buildAutoSummary(comparison, highlights);

  async function handleComplete() {
    if (!review) return;
    setCompleting(true);
    setCompleteError(null);
    const result = await markWeeklyReviewComplete(review.id, getValues("decision"));
    setCompleting(false);
    if ("error" in result) setCompleteError(result.error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/revisao-semanal?week=${previousWeek}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="text-sm font-medium">
            {formatDateBR(weekStart)} – {formatDateBR(weekEnd)}
          </span>
          <Link
            href={`/revisao-semanal?week=${nextWeek}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
            aria-label="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <SaveStatusIndicator status={status} savedAt={savedAt} error={error} onRetry={retry} />
      </div>

      <Card className="border-tone-info-fg/30 bg-tone-info-fg/5">
        <CardContent className="flex items-start gap-3 p-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-tone-info-fg" aria-hidden="true" />
          <p className="text-sm">{autoSummary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_ROWS.map((row) => (
          <StatCard
            key={row.key}
            label={row.label}
            value={row.formatter(comparison.current[row.key])}
            helpText={formatDelta(comparison.deltas[row.key], row.formatter) ?? undefined}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Melhores da semana</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightRow label="Melhor conteúdo" value={highlights.bestContent ? highlights.bestContent.item.title : null} />
          <HighlightRow label="Mais views" value={highlights.mostViews ? `${highlights.mostViews.item.title} (${highlights.mostViews.value.toLocaleString("pt-BR")})` : null} />
          <HighlightRow label="Mais compartilhamentos" value={highlights.mostShares ? `${highlights.mostShares.item.title} (${highlights.mostShares.value.toLocaleString("pt-BR")})` : null} />
          <HighlightRow label="Mais salvamentos" value={highlights.mostSaves ? `${highlights.mostSaves.item.title} (${highlights.mostSaves.value.toLocaleString("pt-BR")})` : null} />
          <HighlightRow label="Mais seguidores" value={highlights.mostFollowersGained ? `${highlights.mostFollowersGained.item.title} (${highlights.mostFollowersGained.value.toLocaleString("pt-BR")})` : null} />
          <HighlightRow label="Mais receita" value={highlights.mostRevenue ? `${highlights.mostRevenue.item.title} (${formatCurrency(highlights.mostRevenue.value)})` : null} />
          <HighlightRow label="Melhor formato" value={highlights.bestFormat ? (FORMAT_LABELS[highlights.bestFormat.key] ?? highlights.bestFormat.key) : null} />
          <HighlightRow label="Melhor pilar" value={highlights.bestPillar ? highlights.bestPillar.key : null} />
          <HighlightRow label="Melhor dia" value={highlights.bestWeekday ? WEEKDAY_LABELS[highlights.bestWeekday.weekday] : null} />
          <HighlightRow label="Melhor horário" value={highlights.bestHour ? `${highlights.bestHour.hour}h` : null} />
          <HighlightRow
            label="Formato que mais trouxe seguidores"
            value={highlights.formatWithMostFollowers ? `${FORMAT_LABELS[highlights.formatWithMostFollowers.format] ?? highlights.formatWithMostFollowers.format} (+${highlights.formatWithMostFollowers.totalFollowersGained})` : null}
          />
          <HighlightRow
            label="Abaixo da média da semana"
            value={highlights.belowAverageContent.length > 0 ? `${highlights.belowAverageContent.length} conteúdo(s)` : null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revisão manual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField id="whatWorked" label="O que funcionou" register={register} />
          <FormField id="whatDidntWork" label="O que não funcionou" register={register} />
          <FormField id="whatToRepeat" label="O que repetir" register={register} />
          <FormField id="whatToStop" label="O que parar" register={register} />
          <FormField id="whatToTest" label="O que testar" register={register} />
          <FormField id="keyLearning" label="Principal aprendizado" register={register} />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="decision">Decisão estratégica da próxima semana</Label>
            <Textarea id="decision" rows={3} placeholder="O que você vai fazer diferente..." {...register("decision")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-start gap-2">
        <Button type="button" onClick={handleComplete} disabled={!review || completing}>
          {review?.completed_at ? "Revisão concluída" : "Concluir revisão da semana"}
        </Button>
        {review?.completed_at ? (
          <p className="text-xs text-muted-foreground">Concluída em {formatDateBR(review.completed_at)}.</p>
        ) : null}
        {completeError ? <p className="text-xs text-destructive">{completeError}</p> : null}
      </div>
    </div>
  );
}

function HighlightRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "Ainda sem dado suficiente"}</span>
    </div>
  );
}

function FormField({
  id,
  label,
  register,
}: {
  id: keyof WeeklyReviewFormValues;
  label: string;
  register: ReturnType<typeof useForm<WeeklyReviewFormValues>>["register"];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={2} {...register(id)} />
    </div>
  );
}
