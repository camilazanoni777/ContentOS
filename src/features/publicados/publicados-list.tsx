"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Copy, ExternalLink, GitCompare } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/layout/filter-bar";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignAssociationBadge } from "@/features/negocio/campaign-association-badge";
import { SearchInput } from "@/components/ui/search-input";
import { duplicateAsRepurposed } from "@/lib/actions/agendamento";
import {
  EMPTY_PUBLICADOS_FILTERS,
  filterPublicadosItems,
  getCapturePendencies,
  isMissingPublishedUrl,
  sortPublicadosItems,
  type PublicadosFilters,
} from "@/lib/publicados";
import { RepurposeComparisonDialog } from "@/features/publicados/repurpose-comparison-dialog";
import type { ContentItem, MetricSnapshot } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/dates";

interface PublicadosListProps {
  initialItems: ContentItem[];
  metricSnapshots: MetricSnapshot[];
  /** Itens já reaproveitados (source_content_id aponta para um dos initialItems), indexados pelo id do original. */
  repurposedBySourceId: Record<string, ContentItem>;
}

export function PublicadosList({ initialItems, metricSnapshots, repurposedBySourceId }: PublicadosListProps) {
  const [filters, setFilters] = React.useState<PublicadosFilters>(EMPTY_PUBLICADOS_FILTERS);
  const [repurposed, setRepurposed] = React.useState(repurposedBySourceId);
  const [duplicating, setDuplicating] = React.useState<string | null>(null);
  const [duplicateError, setDuplicateError] = React.useState<string | null>(null);
  const [comparisonItem, setComparisonItem] = React.useState<ContentItem | null>(null);

  const snapshotsByItem = React.useMemo(() => {
    const map = new Map<string, MetricSnapshot[]>();
    for (const snapshot of metricSnapshots) {
      const list = map.get(snapshot.content_item_id) ?? [];
      list.push(snapshot);
      map.set(snapshot.content_item_id, list);
    }
    return map;
  }, [metricSnapshots]);

  const filtered = sortPublicadosItems(filterPublicadosItems(initialItems, filters, snapshotsByItem));

  async function handleDuplicate(item: ContentItem) {
    setDuplicating(item.id);
    setDuplicateError(null);
    const result = await duplicateAsRepurposed(item.id);
    setDuplicating(null);
    if ("error" in result) {
      setDuplicateError(result.error);
      return;
    }
    setRepurposed((current) => ({ ...current, [item.id]: result.item }));
  }

  return (
    <div className="flex flex-col gap-6">
      <FilterBar>
        <SearchInput
          value={filters.search}
          onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          placeholder="Buscar por título, gancho, URL..."
          className="sm:w-64"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.pendingCapture}
            onChange={(event) => setFilters((current) => ({ ...current, pendingCapture: event.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          Só com métricas pendentes
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.missingUrl}
            onChange={(event) => setFilters((current) => ({ ...current, missingUrl: event.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          Só sem URL do post
        </label>
      </FilterBar>

      {duplicateError ? <p className="text-sm text-destructive">{duplicateError}</p> : null}

      {filtered.length === 0 ? (
        <EmptyState title="Nada publicado ainda" description="Conteúdos publicados aparecem aqui automaticamente." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const pendencies = getCapturePendencies(item, snapshotsByItem.get(item.id) ?? []).filter((p) => p.due);
            const missingUrl = isMissingPublishedUrl(item);
            const repurposedItem = repurposed[item.id];
            return (
              <Card key={item.id} className="flex h-full flex-col">
                <CardHeader className="gap-2 p-5 pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="font-serif text-title">{item.title}</CardTitle>
                    <CampaignAssociationBadge campaignId={item.campaign_id} />
                    <StatusBadge status={item.status} />
                  </div>
                  {item.published_at ? (
                    <p className="text-sm text-muted-foreground">{formatDateTimeBR(item.published_at)}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 p-5 pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {item.published_url ? (
                      <a
                        href={item.published_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-tone-info-fg hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" /> Ver post
                      </a>
                    ) : missingUrl ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tone-warning-bg px-2 py-1 font-medium text-tone-warning-fg">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Sem URL do post
                      </span>
                    ) : null}
                    {pendencies.map((pendency) => (
                      <span
                        key={pendency.window}
                        className="inline-flex items-center gap-1 rounded-full bg-tone-warning-bg px-2 py-1 font-medium text-tone-warning-fg"
                      >
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Métrica {pendency.window} pendente
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    {repurposedItem ? (
                      <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setComparisonItem(item)}>
                        <GitCompare className="h-3.5 w-3.5" aria-hidden="true" /> Comparar com reaproveitado
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={duplicating === item.id}
                        onClick={() => handleDuplicate(item)}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        {duplicating === item.id ? "Duplicando..." : "Duplicar como reaproveitamento"}
                      </Button>
                    )}
                    <Link href={`/ideias`} className="text-xs text-muted-foreground hover:underline">
                      Ver no Banco de ideias
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {comparisonItem && repurposed[comparisonItem.id] ? (
        <RepurposeComparisonDialog
          open={Boolean(comparisonItem)}
          onOpenChange={(open) => !open && setComparisonItem(null)}
          original={comparisonItem}
          repurposed={repurposed[comparisonItem.id]}
        />
      ) : null}
    </div>
  );
}
