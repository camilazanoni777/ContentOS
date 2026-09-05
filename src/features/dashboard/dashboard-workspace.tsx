"use client";

import * as React from "react";

import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/layout/filter-bar";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { CONTENT_FORMATS, CONTENT_OBJECTIVES, FORMAT_LABELS, OBJECTIVE_LABELS } from "@/lib/content-pipeline";
import {
  addDaysISO,
  getPreviousEquivalentRange,
  getWeekRange,
  instantToISODate,
  todayISODate,
} from "@/lib/dates";
import {
  EMPTY_DASHBOARD_FILTERS,
  buildDailyReachViewsSeries,
  buildFollowersSeries,
  buildPlannedVsPublishedSeries,
  compareDashboardPeriods,
  computeGroupPerformance,
  filterDashboardItems,
  selectGoalsOverlappingPeriod,
  topContentByFollowersGained,
  totalFollowersAsOf,
  type DashboardFilters,
} from "@/lib/dashboard";
import { GOAL_METRIC_LABELS, GOAL_STATUS_LABELS, computeGoal, type GoalStatus } from "@/lib/metas";
import { computePerformanceIndexForWindow, rankByPerformanceIndex } from "@/lib/metricas";
import { FollowersEvolutionChart, GroupPerformanceChart, PlannedVsPublishedChart, ReachViewsChart } from "./dashboard-charts";
import type { Campaign, ContentItem, Goal, MetricSnapshot, MetricWindow, Product, ProfileSnapshot } from "@/types/domain";

interface DashboardWorkspaceProps {
  allItems: ContentItem[];
  metricSnapshots: MetricSnapshot[];
  profileSnapshots: ProfileSnapshot[];
  goals: Goal[];
  campaigns: Campaign[];
  products: Product[];
}

const ANALYSIS_WINDOWS: Extract<MetricWindow, "24h" | "7d" | "30d">[] = ["24h", "7d", "30d"];
const ANALYSIS_WINDOW_LABELS: Record<(typeof ANALYSIS_WINDOWS)[number], string> = {
  "24h": "24 horas",
  "7d": "7 dias",
  "30d": "30 dias",
};

const GOAL_STATUS_TONE: Record<GoalStatus, string> = {
  not_started: "bg-tone-neutral-fg",
  in_progress: "bg-tone-info-fg",
  on_pace: "bg-tone-progress-fg",
  at_risk: "bg-tone-warning-fg",
  achieved: "bg-tone-success-fg",
  exceeded: "bg-tone-success-fg",
};

function formatNumber(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function formatCurrency(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDelta(current: number | null, previous: number | null, formatter: (v: number | null) => string): string | undefined {
  if (current === null || previous === null || current === previous) return undefined;
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatter(delta)} vs. período anterior`;
}

function withinPeriod(instant: string | null, from: string, to: string): boolean {
  if (!instant) return false;
  const date = instantToISODate(instant);
  return date >= from && date <= to;
}

export function DashboardWorkspace({ allItems, metricSnapshots, profileSnapshots, goals, campaigns, products }: DashboardWorkspaceProps) {
  const defaultWeek = getWeekRange(todayISODate());
  const [period, setPeriod] = React.useState<DateRange>({ from: defaultWeek.start, to: defaultWeek.end });
  const [filters, setFilters] = React.useState<DashboardFilters>(EMPTY_DASHBOARD_FILTERS);
  const [analysisWindow, setAnalysisWindow] = React.useState<(typeof ANALYSIS_WINDOWS)[number]>("30d");

  const periodStart = period.from ?? defaultWeek.start;
  const periodEnd = period.to ?? defaultWeek.end;
  const previousPeriod = getPreviousEquivalentRange(periodStart, periodEnd);

  const metricSnapshotsByItemId = React.useMemo(() => {
    const map = new Map<string, MetricSnapshot[]>();
    for (const snapshot of metricSnapshots) {
      const list = map.get(snapshot.content_item_id) ?? [];
      list.push(snapshot);
      map.set(snapshot.content_item_id, list);
    }
    return map;
  }, [metricSnapshots]);

  const pillars = React.useMemo(
    () => Array.from(new Set(allItems.map((item) => item.pillar).filter((v): v is string => Boolean(v?.trim())))).sort(),
    [allItems],
  );
  const ctas = React.useMemo(
    () => Array.from(new Set(allItems.map((item) => item.cta).filter((v): v is string => Boolean(v?.trim())))).sort(),
    [allItems],
  );

  const categoryFiltered = React.useMemo(() => filterDashboardItems(allItems, filters), [allItems, filters]);

  const currentPlanned = React.useMemo(
    () => categoryFiltered.filter((item) => withinPeriod(item.scheduled_at, periodStart, periodEnd)),
    [categoryFiltered, periodStart, periodEnd],
  );
  const currentPublished = React.useMemo(
    () => categoryFiltered.filter((item) => item.status === "published" && withinPeriod(item.published_at, periodStart, periodEnd)),
    [categoryFiltered, periodStart, periodEnd],
  );
  const previousPlanned = React.useMemo(
    () => categoryFiltered.filter((item) => withinPeriod(item.scheduled_at, previousPeriod.start, previousPeriod.end)),
    [categoryFiltered, previousPeriod],
  );
  const previousPublished = React.useMemo(
    () => categoryFiltered.filter((item) => item.status === "published" && withinPeriod(item.published_at, previousPeriod.start, previousPeriod.end)),
    [categoryFiltered, previousPeriod],
  );

  const currentProfileSnapshots = React.useMemo(
    () => profileSnapshots.filter((s) => s.snapshot_date >= periodStart && s.snapshot_date <= periodEnd),
    [profileSnapshots, periodStart, periodEnd],
  );
  const previousProfileSnapshots = React.useMemo(
    () => profileSnapshots.filter((s) => s.snapshot_date >= previousPeriod.start && s.snapshot_date <= previousPeriod.end),
    [profileSnapshots, previousPeriod],
  );

  const comparison = React.useMemo(
    () =>
      compareDashboardPeriods(
        {
          plannedItems: currentPlanned,
          publishedItems: currentPublished,
          metricSnapshotsByItemId,
          profileSnapshots: currentProfileSnapshots,
          followersBeforeWeek: totalFollowersAsOf(profileSnapshots, addDaysISO(periodStart, -1)),
          followersEndOfWeek: totalFollowersAsOf(profileSnapshots, periodEnd),
        },
        {
          plannedItems: previousPlanned,
          publishedItems: previousPublished,
          metricSnapshotsByItemId,
          profileSnapshots: previousProfileSnapshots,
          followersBeforeWeek: totalFollowersAsOf(profileSnapshots, addDaysISO(previousPeriod.start, -1)),
          followersEndOfWeek: totalFollowersAsOf(profileSnapshots, previousPeriod.end),
        },
      ),
    [
      currentPlanned,
      currentPublished,
      previousPlanned,
      previousPublished,
      metricSnapshotsByItemId,
      currentProfileSnapshots,
      previousProfileSnapshots,
      profileSnapshots,
      periodStart,
      periodEnd,
      previousPeriod,
    ],
  );

  // Índice de performance: base histórica ampla (TODOS os conteúdos publicados, não só os do período) —
  // mesmo motivo de revisao-semanal.ts, para não julgar um conteúdo comparando com uma amostra pequena e enviesada.
  const allPublishedForIndex = React.useMemo(() => categoryFiltered.filter((item) => item.status === "published" || item.status === "repurpose"), [categoryFiltered]);
  const indexByItemId = React.useMemo(
    () => computePerformanceIndexForWindow(allPublishedForIndex, metricSnapshotsByItemId, analysisWindow),
    [allPublishedForIndex, metricSnapshotsByItemId, analysisWindow],
  );

  const topByIndex = React.useMemo(() => rankByPerformanceIndex(currentPublished, indexByItemId, 5), [currentPublished, indexByItemId]);
  const topByFollowers = React.useMemo(() => topContentByFollowersGained(currentPublished, metricSnapshotsByItemId, 5), [currentPublished, metricSnapshotsByItemId]);

  const performanceByFormat = React.useMemo(() => computeGroupPerformance(currentPublished, indexByItemId, (i) => i.format), [currentPublished, indexByItemId]);
  const performanceByPillar = React.useMemo(() => computeGroupPerformance(currentPublished, indexByItemId, (i) => i.pillar), [currentPublished, indexByItemId]);
  const performanceByObjective = React.useMemo(() => computeGroupPerformance(currentPublished, indexByItemId, (i) => i.objective), [currentPublished, indexByItemId]);

  const followersSeries = React.useMemo(() => buildFollowersSeries(profileSnapshots, periodStart, periodEnd), [profileSnapshots, periodStart, periodEnd]);
  const reachViewsSeries = React.useMemo(() => buildDailyReachViewsSeries(currentPublished, metricSnapshotsByItemId, periodStart, periodEnd), [currentPublished, metricSnapshotsByItemId, periodStart, periodEnd]);
  const plannedVsPublishedSeries = React.useMemo(() => buildPlannedVsPublishedSeries(currentPlanned, currentPublished, periodStart, periodEnd), [currentPlanned, currentPublished, periodStart, periodEnd]);

  const relevantGoals = React.useMemo(() => selectGoalsOverlappingPeriod(goals, periodStart, periodEnd), [goals, periodStart, periodEnd]);
  const goalSources = React.useMemo(
    () => ({ profileSnapshots, contentItems: allItems, metricSnapshotsByItemId }),
    [profileSnapshots, allItems, metricSnapshotsByItemId],
  );
  const computedGoals = React.useMemo(
    () => relevantGoals.map((goal) => computeGoal(goal, goalSources, todayISODate())),
    [relevantGoals, goalSources],
  );

  return (
    <div className="flex flex-col gap-6">
      <FilterBar>
        <DateRangePicker value={period} onChange={setPeriod} />
        <Select value={filters.format} onChange={(e) => setFilters({ ...filters, format: e.target.value })} className="h-9 w-auto">
          <option value="">Todos os formatos</option>
          {CONTENT_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>
        <Select value={filters.pillar} onChange={(e) => setFilters({ ...filters, pillar: e.target.value })} className="h-9 w-auto">
          <option value="">Todos os pilares</option>
          {pillars.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <Select value={filters.objective} onChange={(e) => setFilters({ ...filters, objective: e.target.value })} className="h-9 w-auto">
          <option value="">Todos os objetivos</option>
          {CONTENT_OBJECTIVES.map((o) => (
            <option key={o} value={o}>{OBJECTIVE_LABELS[o]}</option>
          ))}
        </Select>
        <Select value={filters.campaignId} onChange={(e) => setFilters({ ...filters, campaignId: e.target.value })} className="h-9 w-auto">
          <option value="">Todas as campanhas</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select value={filters.cta} onChange={(e) => setFilters({ ...filters, cta: e.target.value })} className="h-9 w-auto">
          <option value="">Todos os CTAs</option>
          {ctas.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={filters.productId} onChange={(e) => setFilters({ ...filters, productId: e.target.value })} className="h-9 w-auto">
          <option value="">Todos os produtos</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
        <Select value={analysisWindow} onChange={(e) => setAnalysisWindow(e.target.value as (typeof ANALYSIS_WINDOWS)[number])} className="h-9 w-auto">
          {ANALYSIS_WINDOWS.map((w) => (
            <option key={w} value={w}>Janela: {ANALYSIS_WINDOW_LABELS[w]}</option>
          ))}
        </Select>
      </FilterBar>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Publicados" value={formatNumber(comparison.current.publishedCount)} helpText={formatDelta(comparison.current.publishedCount, comparison.previous.publishedCount, formatNumber)} />
        <StatCard label="% de execução" value={comparison.current.executionPercent === null ? "—" : `${comparison.current.executionPercent}%`} helpText={formatDelta(comparison.current.executionPercent, comparison.previous.executionPercent, (v) => (v === null ? "—" : `${v}%`))} />
        <StatCard label="Views" value={formatNumber(comparison.current.views)} helpText={formatDelta(comparison.current.views, comparison.previous.views, formatNumber)} />
        <StatCard label="Alcance" value={formatNumber(comparison.current.reach)} helpText={formatDelta(comparison.current.reach, comparison.previous.reach, formatNumber)} />
        <StatCard label="Taxa de engajamento" value={comparison.current.engagementRate === null ? "—" : `${comparison.current.engagementRate.toFixed(1)}%`} helpText={formatDelta(comparison.current.engagementRate, comparison.previous.engagementRate, (v) => (v === null ? "—" : `${v.toFixed(1)}%`))} />
        <StatCard label="Seguidores ganhos" value={formatNumber(comparison.current.followersGained)} helpText={formatDelta(comparison.current.followersGained, comparison.previous.followersGained, formatNumber)} />
        <StatCard label="Vendas" value={formatNumber(comparison.current.sales)} helpText={formatDelta(comparison.current.sales, comparison.previous.sales, formatNumber)} />
        <StatCard label="Receita" value={formatCurrency(comparison.current.revenue)} helpText={formatDelta(comparison.current.revenue, comparison.previous.revenue, formatCurrency)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução de seguidores</CardTitle></CardHeader>
          <CardContent><FollowersEvolutionChart points={followersSeries} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Alcance e views por dia</CardTitle></CardHeader>
          <CardContent><ReachViewsChart points={reachViewsSeries} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Planejado versus publicado</CardTitle></CardHeader>
          <CardContent><PlannedVsPublishedChart points={plannedVsPublishedSeries} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Desempenho por formato</CardTitle></CardHeader>
          <CardContent><GroupPerformanceChart data={performanceByFormat} labelFor={(k) => FORMAT_LABELS[k] ?? k} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Desempenho por pilar</CardTitle></CardHeader>
          <CardContent><GroupPerformanceChart data={performanceByPillar} labelFor={(k) => k} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Desempenho por objetivo</CardTitle></CardHeader>
          <CardContent><GroupPerformanceChart data={performanceByObjective} labelFor={(k) => OBJECTIVE_LABELS[k] ?? k} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top conteúdos por índice de performance</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {topByIndex.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum conteúdo com índice calculável neste período.</p>
            ) : (
              topByIndex.map((entry) => (
                <div key={entry.item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{entry.item.title}</span>
                  <span className="shrink-0 font-medium">{Math.round(entry.result.index ?? 0)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top conteúdos por seguidores ganhos</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {topByFollowers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum conteúdo com ganho de seguidores registrado neste período.</p>
            ) : (
              topByFollowers.map((entry) => (
                <div key={entry.item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{entry.item.title}</span>
                  <span className="shrink-0 font-medium">+{entry.followersGained.toLocaleString("pt-BR")}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Progresso das metas</CardTitle></CardHeader>
        <CardContent>
          {computedGoals.length === 0 ? (
            <EmptyState title="Nenhuma meta neste período" description="Cadastre uma meta em Planejar → Metas para acompanhar o progresso aqui." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {computedGoals.map((computed) => (
                <div key={computed.goal.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{GOAL_METRIC_LABELS[computed.goal.metric as keyof typeof GOAL_METRIC_LABELS] ?? computed.goal.metric}</span>
                    <span className="text-xs text-muted-foreground">{GOAL_STATUS_LABELS[computed.status]}</span>
                  </div>
                  <Progress value={computed.progressPercent ?? 0} indicatorClassName={GOAL_STATUS_TONE[computed.status]} />
                  <span className="text-xs text-muted-foreground">{computed.progressPercent === null ? "—" : `${computed.progressPercent.toFixed(0)}%`} do alvo</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
