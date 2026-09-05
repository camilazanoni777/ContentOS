"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SaveStatusIndicator } from "@/components/feedback/save-status-indicator";
import { StatusBadge } from "@/components/layout/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import { saveWeeklyPlan } from "@/lib/actions/planejamento";
import { buildWeeklyDailyGrid } from "@/lib/planejamento-semanal";
import { addDaysISO } from "@/lib/dates";
import type { WeeklyPlanFormValues } from "@/features/planejamento/weekly-plan-form-types";
import type { WeeklyPlanStats } from "@/lib/data/weekly-plan";
import type { Campaign, ContentItem, WeeklyReview } from "@/types/domain";

interface WeeklyPlanWorkspaceProps {
  weekStart: string;
  weekEnd: string;
  review: WeeklyReview | null;
  stats: WeeklyPlanStats;
  candidateContentItems: ContentItem[];
  campaigns: Campaign[];
}

const WEEKDAY_LABELS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function toDefaultValues(review: WeeklyReview | null): WeeklyPlanFormValues {
  return {
    strategicFocus: review?.strategic_focus ?? "",
    weeklyExperiment: review?.weekly_experiment ?? "",
    priorityContentId: review?.priority_content_id ?? "",
    activeCampaignId: review?.active_campaign_id ?? "",
    plannedHours: review?.planned_hours !== null && review?.planned_hours !== undefined ? String(review.planned_hours) : "",
  };
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR");
}

function formatCurrency(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function WeeklyPlanWorkspace({ weekStart, weekEnd, review, stats, candidateContentItems, campaigns }: WeeklyPlanWorkspaceProps) {
  const { register, watch } = useForm<WeeklyPlanFormValues>({ defaultValues: toDefaultValues(review) });
  const values = watch();

  const { status, savedAt, error, retry } = useAutosave({
    value: values,
    save: (current) => saveWeeklyPlan(weekStart, current),
  });

  const dailyGrid = buildWeeklyDailyGrid(weekStart, stats.itemsForGrid);
  const previousWeek = addDaysISO(weekStart, -7);
  const nextWeek = addDaysISO(weekStart, 7);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/planejamento/semana?week=${previousWeek}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground" aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="text-sm font-medium">
            {new Date(`${weekStart}T00:00:00`).toLocaleDateString("pt-BR")} – {new Date(`${weekEnd}T00:00:00`).toLocaleDateString("pt-BR")}
          </span>
          <Link href={`/planejamento/semana?week=${nextWeek}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground" aria-label="Próxima semana">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <SaveStatusIndicator status={status} savedAt={savedAt} error={error} onRetry={retry} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {[
          { label: "Planejados", value: formatNumber(stats.plannedCount) },
          { label: "Publicados", value: formatNumber(stats.publishedCount) },
          { label: "% de execução", value: stats.executionPercent === null ? "—" : `${stats.executionPercent}%` },
          { label: "Seguidores", value: stats.followersDelta === null ? "—" : (stats.followersDelta >= 0 ? `+${stats.followersDelta}` : String(stats.followersDelta)) },
          { label: "Vendas", value: formatNumber(stats.sales) },
          { label: "Receita", value: formatCurrency(stats.revenue) },
          { label: "Horas planejadas", value: values.plannedHours || "—" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-lg font-semibold">{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano da semana</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="strategicFocus">Foco estratégico</Label>
            <Textarea id="strategicFocus" rows={2} placeholder="O que mais importa entregar nesta semana..." {...register("strategicFocus")} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="weeklyExperiment">Experimento da semana</Label>
            <Textarea id="weeklyExperiment" rows={2} placeholder="O que testar essa semana..." {...register("weeklyExperiment")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priorityContentId">Conteúdo prioritário</Label>
            <Select id="priorityContentId" {...register("priorityContentId")}>
              <option value="">Nenhum</option>
              {candidateContentItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activeCampaignId">Campanha ativa</Label>
            <Select id="activeCampaignId" {...register("activeCampaignId")}>
              <option value="">Nenhuma</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plannedHours">Horas planejadas para produção</Label>
            <Input id="plannedHours" inputMode="decimal" placeholder="Ex.: 8" {...register("plannedHours")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grade diária</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {dailyGrid.map((day, index) => (
            <div key={day.date} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{WEEKDAY_LABELS[index]}</span>
                <span className="text-xs text-muted-foreground">{new Date(`${day.date}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              </div>
              {day.scheduled.length === 0 && day.published.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nada planejado</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {day.published.map((item) => (
                    <div key={`published-${item.id}`} className="flex items-center gap-1.5 text-xs">
                      <StatusBadge status={item.status} />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                  {day.scheduled
                    .filter((item) => !day.published.some((published) => published.id === item.id))
                    .map((item) => (
                      <div key={`scheduled-${item.id}`} className="flex items-center gap-1.5 text-xs">
                        <StatusBadge status={item.status} />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
