"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/layout/filter-bar";
import { StatusBadge } from "@/components/layout/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignAssociationBadge } from "@/features/negocio/campaign-association-badge";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import {
  EMPTY_AGENDAMENTO_FILTERS,
  filterAgendamentoItems,
  isMissingPublishedUrl,
  isSchedulingChecklistComplete,
  parseSchedulingChecklist,
  schedulingChecklistProgress,
  sortAgendamentoItems,
  type AgendamentoFilters,
} from "@/lib/agendamento";
import type { Campaign, ContentItem } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/dates";

interface AgendamentoListProps {
  initialItems: ContentItem[];
  campaigns: Campaign[];
}

/** Lista da página Agendamento: filtros/busca sobre content_items (status scheduled) — cada card abre o workspace completo em /agendamento/[id]. */
export function AgendamentoList({ initialItems, campaigns }: AgendamentoListProps) {
  const [filters, setFilters] = React.useState<AgendamentoFilters>(EMPTY_AGENDAMENTO_FILTERS);
  const filtered = sortAgendamentoItems(filterAgendamentoItems(initialItems, filters));

  return (
    <div className="flex flex-col gap-6">
      <FilterBar>
        <SearchInput
          value={filters.search}
          onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          placeholder="Buscar por título, gancho, legenda..."
          className="sm:w-64"
        />
        {campaigns.length > 0 ? (
          <Select
            value={filters.campaignId}
            onChange={(event) => setFilters((current) => ({ ...current, campaignId: event.target.value }))}
            className="sm:w-48"
            aria-label="Filtrar por campanha"
          >
            <option value="">Todas as campanhas</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.checklistIncomplete}
            onChange={(event) => setFilters((current) => ({ ...current, checklistIncomplete: event.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          Só checklist incompleto
        </label>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState title="Nada agendado no momento" description="Aprove um conteúdo em Edição para ele aparecer aqui." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const checklist = parseSchedulingChecklist(item.scheduling_checklist);
            const progress = schedulingChecklistProgress(checklist);
            const complete = isSchedulingChecklistComplete(checklist);
            return (
              <Link key={item.id} href={`/agendamento/${item.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader className="gap-2 p-5 pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="font-serif text-title">{item.title}</CardTitle>
                      <CampaignAssociationBadge campaignId={item.campaign_id} />
                      <StatusBadge status={item.status} />
                    </div>
                    {item.scheduled_at ? (
                      <p className="text-sm text-muted-foreground">{formatDateTimeBR(item.scheduled_at)}</p>
                    ) : (
                      <p className="text-sm text-tone-warning-fg">Sem data/hora planejadas</p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-2 p-5 pt-0 text-xs text-muted-foreground">
                    <span className={complete ? "text-tone-success-fg" : undefined}>
                      Checklist {progress.checked}/{progress.total}
                    </span>
                    {isMissingPublishedUrl(item) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tone-warning-bg px-2 py-1 font-medium text-tone-warning-fg">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Sem URL do post
                      </span>
                    ) : null}
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
