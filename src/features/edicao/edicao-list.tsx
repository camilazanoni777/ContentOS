"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/layout/filter-bar";
import { PriorityBadge } from "@/components/layout/priority-badge";
import { StatusBadge } from "@/components/layout/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignAssociationBadge } from "@/features/negocio/campaign-association-badge";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import {
  EDICAO_STATUSES,
  EMPTY_EDICAO_FILTERS,
  filterEdicaoItems,
  isOverdue,
  listEditors,
  type EdicaoFilters,
} from "@/lib/editing";
import { CONTENT_STATUS_LABELS, type ContentItem } from "@/types/domain";
import { formatDateBR } from "@/lib/dates";

interface EdicaoListProps {
  initialItems: ContentItem[];
}

/** Lista da página Edição: filtros/busca sobre content_items (recorded/editing/awaiting_approval) — cada card abre o workspace completo em /edicao/[id]. */
export function EdicaoList({ initialItems }: EdicaoListProps) {
  const [filters, setFilters] = React.useState<EdicaoFilters>(EMPTY_EDICAO_FILTERS);
  const editors = listEditors(initialItems);
  const filtered = filterEdicaoItems(initialItems, filters);

  return (
    <div className="flex flex-col gap-6">
      <FilterBar>
        <SearchInput
          value={filters.search}
          onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          placeholder="Buscar por título, gancho, editor..."
          className="sm:w-64"
        />
        <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="sm:w-48" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          {EDICAO_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CONTENT_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        {editors.length > 0 ? (
          <Select value={filters.editor} onChange={(event) => setFilters((current) => ({ ...current, editor: event.target.value }))} className="sm:w-44" aria-label="Filtrar por editor">
            <option value="">Todos os editores</option>
            {editors.map((editor) => (
              <option key={editor} value={editor}>
                {editor}
              </option>
            ))}
          </Select>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.overdue}
            onChange={(event) => setFilters((current) => ({ ...current, overdue: event.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          Só atrasados
        </label>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState title="Nada em edição no momento" description="Esses conteúdos aparecerão aqui ao avançarem no pipeline." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const overdue = isOverdue(item);
            return (
              <Link key={item.id} href={`/edicao/${item.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader className="gap-2 p-5 pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="font-serif text-title">{item.title}</CardTitle>
                      <CampaignAssociationBadge campaignId={item.campaign_id} />
                      <StatusBadge status={item.status} />
                    </div>
                    {item.editor_name ? <p className="text-sm text-muted-foreground">Editor: {item.editor_name}</p> : null}
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-2 p-5 pt-0 text-xs text-muted-foreground">
                    <PriorityBadge priority={item.priority} />
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tone-danger-bg px-2 py-1 font-medium text-tone-danger-fg">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Atrasado
                      </span>
                    ) : null}
                    {item.production_due_at ? <span>Prazo: {formatDateBR(item.production_due_at)}</span> : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
