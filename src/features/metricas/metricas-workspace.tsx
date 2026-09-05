"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Eye, PlusCircle } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/layout/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { CONTENT_FORMATS, CONTENT_OBJECTIVES, FORMAT_LABELS, OBJECTIVE_LABELS } from "@/lib/content-pipeline";
import {
  EMPTY_METRICAS_FILTERS,
  METRICAS_SORT_LABELS,
  computePerformanceIndexForWindow,
  filterMetricasItems,
  getCapturePendencies,
  mostRecentSnapshot,
  rankByPerformanceIndex,
  sortMetricasItems,
  type MetricasFilters,
  type MetricasSort,
} from "@/lib/metricas";
import { PerformanceIndexBadge } from "./performance-index-breakdown";
import { PerformanceRankingChart } from "./metricas-charts";
import { MetricCaptureDrawer } from "./metric-capture-drawer";
import type { Campaign, ContentItem, InstagramAccount, MetricSnapshot, MetricWindow } from "@/types/domain";
import { formatDateBR } from "@/lib/dates";

interface MetricasWorkspaceProps {
  initialItems: ContentItem[];
  metricSnapshots: MetricSnapshot[];
  campaigns: Campaign[];
  accounts: InstagramAccount[];
}

const COMPARISON_WINDOWS: Extract<MetricWindow, "24h" | "7d" | "30d">[] = ["24h", "7d", "30d"];
const COMPARISON_WINDOW_LABELS: Record<(typeof COMPARISON_WINDOWS)[number], string> = {
  "24h": "24 horas",
  "7d": "7 dias",
  "30d": "30 dias",
};

export function MetricasWorkspace({ initialItems, metricSnapshots, campaigns, accounts }: MetricasWorkspaceProps) {
  const [items] = React.useState(initialItems);
  const [snapshots, setSnapshots] = React.useState(metricSnapshots);
  const [filters, setFilters] = React.useState<MetricasFilters>(EMPTY_METRICAS_FILTERS);
  const [sort, setSort] = React.useState<MetricasSort>("index_desc");
  const [comparisonWindow, setComparisonWindow] = React.useState<(typeof COMPARISON_WINDOWS)[number]>("7d");
  const [drawerState, setDrawerState] = React.useState<{ itemId: string; snapshot: MetricSnapshot | null } | null>(null);

  const snapshotsByItem = React.useMemo(() => {
    const map = new Map<string, MetricSnapshot[]>();
    for (const snapshot of snapshots) {
      const list = map.get(snapshot.content_item_id) ?? [];
      list.push(snapshot);
      map.set(snapshot.content_item_id, list);
    }
    return map;
  }, [snapshots]);

  const indexByItem = React.useMemo(
    () => computePerformanceIndexForWindow(items, snapshotsByItem, comparisonWindow),
    [items, snapshotsByItem, comparisonWindow],
  );

  const pillars = React.useMemo(
    () => Array.from(new Set(items.map((item) => item.pillar).filter((value): value is string => Boolean(value?.trim())))).sort(),
    [items],
  );

  const filtered = filterMetricasItems(items, filters, snapshotsByItem, indexByItem);
  const sorted = sortMetricasItems(filtered, sort, indexByItem, snapshotsByItem);

  const pendingCount = items.filter((item) => getCapturePendencies(item, snapshotsByItem.get(item.id) ?? []).some((p) => p.due)).length;
  const insufficientCount = Array.from(indexByItem.values()).filter((result) => result.state === "insufficient_data").length;

  const ranking = React.useMemo(() => rankByPerformanceIndex(sorted, indexByItem, 5), [sorted, indexByItem]);

  function handleSnapshotSaved(snapshot: MetricSnapshot) {
    setSnapshots((current) => {
      const withoutOld = current.filter((s) => s.id !== snapshot.id);
      return [...withoutOld, snapshot];
    });
  }

  function handleSnapshotDeleted(id: string) {
    setSnapshots((current) => current.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <FilterBar>
        <SearchInput
          value={filters.search}
          onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          placeholder="Buscar por título, gancho, pilar..."
          className="sm:w-56"
        />
        <Select
          aria-label="Filtrar por formato"
          value={filters.format}
          onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value }))}
          className="sm:w-36"
        >
          <option value="">Todos os formatos</option>
          {CONTENT_FORMATS.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por pilar"
          value={filters.pillar}
          onChange={(event) => setFilters((current) => ({ ...current, pillar: event.target.value }))}
          className="sm:w-40"
        >
          <option value="">Todos os pilares</option>
          {pillars.map((pillar) => (
            <option key={pillar} value={pillar}>
              {pillar}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por objetivo"
          value={filters.objective}
          onChange={(event) => setFilters((current) => ({ ...current, objective: event.target.value }))}
          className="sm:w-40"
        >
          <option value="">Todos os objetivos</option>
          {CONTENT_OBJECTIVES.map((objective) => (
            <option key={objective} value={objective}>
              {OBJECTIVE_LABELS[objective]}
            </option>
          ))}
        </Select>
        {accounts.length > 1 ? (
          <Select
            aria-label="Filtrar por conta"
            value={filters.accountId}
            onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}
            className="sm:w-40"
          >
            <option value="">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                @{account.handle}
              </option>
            ))}
          </Select>
        ) : null}
        {campaigns.length > 0 ? (
          <Select
            aria-label="Filtrar por campanha"
            value={filters.campaignId}
            onChange={(event) => setFilters((current) => ({ ...current, campaignId: event.target.value }))}
            className="sm:w-40"
          >
            <option value="">Todas as campanhas</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        ) : null}
        <Select
          aria-label="Filtrar por faixa do índice"
          value={filters.tier}
          onChange={(event) => setFilters((current) => ({ ...current, tier: event.target.value as MetricasFilters["tier"] }))}
          className="sm:w-40"
        >
          <option value="">Todas as faixas</option>
          <option value="below_average">Abaixo da média</option>
          <option value="average">Dentro da média</option>
          <option value="above_average">Acima da média</option>
          <option value="viral">Viral</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.pendingCaptureOnly}
            onChange={(event) => setFilters((current) => ({ ...current, pendingCaptureOnly: event.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          Só com métricas pendentes
        </label>
      </FilterBar>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Comparar janela:</span>
          <div className="flex gap-1 rounded-md border border-input p-0.5">
            {COMPARISON_WINDOWS.map((window) => (
              <Button
                key={window}
                type="button"
                size="sm"
                variant={comparisonWindow === window ? "default" : "ghost"}
                onClick={() => setComparisonWindow(window)}
              >
                {COMPARISON_WINDOW_LABELS[window]}
              </Button>
            ))}
          </div>
        </div>
        <Select
          aria-label="Ordenar por"
          value={sort}
          onChange={(event) => setSort(event.target.value as MetricasSort)}
          className="w-56"
        >
          {Object.entries(METRICAS_SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {pendingCount > 0 || insufficientCount > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {pendingCount > 0 ? (
            <p className="flex items-center gap-1.5 rounded-lg bg-tone-warning-bg px-3 py-2 text-sm font-medium text-tone-warning-fg">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {pendingCount} {pendingCount === 1 ? "conteúdo tem" : "conteúdos têm"} captura de métrica pendente (24h/7d/30d).
            </p>
          ) : null}
          {insufficientCount > 0 ? (
            <p className="flex items-center gap-1.5 rounded-lg bg-tone-neutral-bg px-3 py-2 text-sm text-tone-neutral-fg">
              {insufficientCount} {insufficientCount === 1 ? "conteúdo ainda não tem" : "conteúdos ainda não têm"} base histórica
              suficiente para um índice de performance nesta janela.
            </p>
          ) : null}
        </div>
      ) : null}

      {ranking.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-title">Ranking — {COMPARISON_WINDOW_LABELS[comparisonWindow]}</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceRankingChart ranked={ranking} />
          </CardContent>
        </Card>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo publicado encontrado"
          description="Ajuste os filtros, ou volte aqui assim que o primeiro conteúdo for publicado."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Conteúdo</th>
                <th className="p-3">Formato/pilar</th>
                <th className="p-3">Publicado em</th>
                <th className="p-3">Views ({COMPARISON_WINDOW_LABELS[comparisonWindow]})</th>
                <th className="p-3">Engajamento</th>
                <th className="p-3">Índice</th>
                <th className="p-3">Pendências</th>
                <th className="p-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((item) => {
                const itemSnapshots = snapshotsByItem.get(item.id) ?? [];
                const windowSnapshot = itemSnapshots.find((s) => s.window_type === comparisonWindow) ?? null;
                const latest = mostRecentSnapshot(itemSnapshots);
                const result = indexByItem.get(item.id);
                const pendencies = getCapturePendencies(item, itemSnapshots).filter((p) => p.due);
                return (
                  <tr key={item.id} className="align-top hover:bg-muted/30">
                    <td className="max-w-xs p-3">
                      <Link href={`/metricas/conteudos/${item.id}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <p>{item.format ? FORMAT_LABELS[item.format] ?? item.format : "—"}</p>
                      <p className="text-xs">{item.pillar ?? "Sem pilar"}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {item.published_at ? formatDateBR(item.published_at) : "—"}
                    </td>
                    <td className="p-3">{windowSnapshot?.views !== null && windowSnapshot?.views !== undefined ? windowSnapshot.views.toLocaleString("pt-BR") : "—"}</td>
                    <td className="p-3">
                      {latest && result?.breakdown.find((c) => c.key === "engagementRate")?.value != null
                        ? `${result.breakdown.find((c) => c.key === "engagementRate")!.value!.toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="p-3">{result ? <PerformanceIndexBadge result={result} /> : "—"}</td>
                    <td className="p-3">
                      {pendencies.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-tone-warning-bg px-2 py-1 text-xs font-medium text-tone-warning-fg">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          {pendencies.map((p) => p.window).join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Em dia</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost" className="gap-1">
                          <Link href={`/metricas/conteudos/${item.id}`}>
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Detalhes
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setDrawerState({ itemId: item.id, snapshot: null })}
                        >
                          <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" /> Registrar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {drawerState ? (
        <MetricCaptureDrawer
          open={Boolean(drawerState)}
          onOpenChange={(open) => !open && setDrawerState(null)}
          contentItemId={drawerState.itemId}
          snapshots={snapshotsByItem.get(drawerState.itemId) ?? []}
          editSnapshot={drawerState.snapshot}
          onSaved={handleSnapshotSaved}
          onDeleted={handleSnapshotDeleted}
        />
      ) : null}
    </div>
  );
}
