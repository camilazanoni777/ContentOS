"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, LayoutGrid, List, Plus, Rows3 } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/layout/filter-bar";
import { PriorityBadge } from "@/components/layout/priority-badge";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { CampaignAssociationBadge } from "@/features/negocio/campaign-association-badge";
import { addItemsToSession, markAsRecorded, saveRecordingChecklist } from "@/lib/actions/recording";
import type { RecordingSessionItemWithContent } from "@/lib/data/recording-sessions";
import { CONTENT_FORMATS, FORMAT_LABELS } from "@/lib/content-pipeline";
import {
  EMPTY_GRAVACAO_FILTERS,
  GRAVACAO_STATUSES,
  filterGravacaoItems,
  parseRecordingChecklist,
  recordingChecklistProgress,
  type GravacaoFilters,
} from "@/lib/recording";
import { CONTENT_STATUS_LABELS, type ContentItem, type RecordingSession } from "@/types/domain";
import { RecordingChecklistSection } from "./recording-checklist-section";
import { SessionFormDialog } from "./session-form-dialog";
import { SessionPanel } from "./session-panel";

type ViewMode = "list" | "cards" | "sessions";

interface GravacaoWorkspaceProps {
  initialItems: ContentItem[];
  initialSessions: RecordingSession[];
  initialSessionItems: RecordingSessionItemWithContent[];
}

function ItemChecklistToggle({ item }: { item: ContentItem }) {
  const [open, setOpen] = React.useState(false);
  const [checklist, setChecklist] = React.useState(parseRecordingChecklist(item.recording_checklist));
  const progress = recordingChecklistProgress(checklist);

  async function handleChange(key: keyof typeof checklist, checked: boolean) {
    const next = { ...checklist, [key]: checked };
    setChecklist(next);
    await saveRecordingChecklist(item.id, next);
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="w-fit text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => setOpen((current) => !current)}>
        Checklist {progress.checked}/{progress.total} {open ? "▲" : "▼"}
      </button>
      {open ? <RecordingChecklistSection value={checklist} onChange={handleChange} compact /> : null}
    </div>
  );
}

function MarkRecordedButton({ item, onDone }: { item: ContentItem; onDone: (item: ContentItem) => void }) {
  const [saving, setSaving] = React.useState(false);
  if (item.status === "recorded") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-tone-success-fg">
        <Check className="h-3.5 w-3.5" aria-hidden="true" /> Gravado
      </span>
    );
  }
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={saving}
      onClick={async () => {
        setSaving(true);
        const result = await markAsRecorded(item.id);
        setSaving(false);
        if ("success" in result) onDone(result.item);
      }}
    >
      {saving ? "Salvando..." : "Marcar como gravado"}
    </Button>
  );
}

/**
 * Workspace da página Gravação: modos lista, cards e sessão em lote sobre
 * os mesmos content_items (ready_to_record/recorded) — nunca uma tabela
 * separada de "itens de gravação".
 */
export function GravacaoWorkspace({ initialItems, initialSessions, initialSessionItems }: GravacaoWorkspaceProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [sessions, setSessions] = React.useState(initialSessions);
  const [sessionItems, setSessionItems] = React.useState(initialSessionItems);
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [filters, setFilters] = React.useState<GravacaoFilters>(EMPTY_GRAVACAO_FILTERS);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(sessions[0]?.id ?? null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filteredItems = filterGravacaoItems(items, filters);
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const activeSessionItems = sessionItems.filter((entry) => entry.session_id === activeSessionId);

  function updateItem(next: ContentItem) {
    setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
    setSessionItems((current) => current.map((entry) => (entry.content_item.id === next.id ? { ...entry, content_item: next } : entry)));
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleAddSelectedToSession() {
    if (!activeSession || selectedIds.size === 0) return;
    setError(null);
    const startingSortOrder = activeSessionItems.length;
    const result = await addItemsToSession({
      sessionId: activeSession.id,
      contentItemIds: [...selectedIds],
      startingSortOrder,
    });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  const viewToggle = (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Button type="button" size="sm" variant={viewMode === "list" ? "secondary" : "ghost"} className="gap-1.5" onClick={() => setViewMode("list")}>
        <List className="h-3.5 w-3.5" aria-hidden="true" /> Lista
      </Button>
      <Button type="button" size="sm" variant={viewMode === "cards" ? "secondary" : "ghost"} className="gap-1.5" onClick={() => setViewMode("cards")}>
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" /> Cards
      </Button>
      <Button type="button" size="sm" variant={viewMode === "sessions" ? "secondary" : "ghost"} className="gap-1.5" onClick={() => setViewMode("sessions")}>
        <Rows3 className="h-3.5 w-3.5" aria-hidden="true" /> Sessão em lote
      </Button>
    </div>
  );

  const filterControls = (
    <FilterBar>
      <SearchInput
        value={filters.search}
        onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
        placeholder="Buscar por título, gancho, pilar..."
        className="sm:w-64"
      />
      <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="sm:w-48" aria-label="Filtrar por status">
        <option value="">Todos os status</option>
        {GRAVACAO_STATUSES.map((status) => (
          <option key={status} value={status}>
            {CONTENT_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Select value={filters.format} onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value }))} className="sm:w-44" aria-label="Filtrar por formato">
        <option value="">Todos os formatos</option>
        {CONTENT_FORMATS.map((format) => (
          <option key={format.value} value={format.value}>
            {format.label}
          </option>
        ))}
      </Select>
    </FilterBar>
  );

  if (viewMode === "sessions") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {viewToggle}
          <Button type="button" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Nova sessão
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {sessions.length === 0 ? (
          <EmptyState title="Nenhuma sessão criada" description="Crie uma sessão para agrupar conteúdos por cenário e roupa." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {sessions.map((session) => (
              <Button
                key={session.id}
                type="button"
                size="sm"
                variant={session.id === activeSessionId ? "secondary" : "outline"}
                onClick={() => setActiveSessionId(session.id)}
              >
                {session.session_date ? new Date(`${session.session_date}T00:00:00`).toLocaleDateString("pt-BR") : "Sem data"}
                {session.location ? ` · ${session.location}` : ""}
              </Button>
            ))}
          </div>
        )}
        {activeSession ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SessionPanel
              session={activeSession}
              items={activeSessionItems}
              onItemsChange={(next) =>
                setSessionItems((current) => [...current.filter((entry) => entry.session_id !== activeSession.id), ...next])
              }
              onEdit={() => setDialogOpen(true)}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar conteúdos à sessão</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {filterControls}
                <div className="flex flex-col gap-2">
                  {filteredItems.length === 0 ? (
                    <EmptyState title="Nada por aqui" description="Ajuste os filtros ou volte quando houver conteúdos prontos para gravar." />
                  ) : (
                    filteredItems.map((item) => (
                      <label key={item.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-2.5 text-sm">
                        <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={(checked) => toggleSelected(item.id, checked)} className="mt-0.5" />
                        <span className="flex flex-1 flex-col gap-1">
                          <span className="font-medium">{item.title}</span>
                          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <StatusBadge status={item.status} />
                            {item.format ? <span>{FORMAT_LABELS[item.format] ?? item.format}</span> : null}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <Button type="button" disabled={selectedIds.size === 0} onClick={handleAddSelectedToSession}>
                  Adicionar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""} à sessão
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
        <SessionFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          session={activeSession}
          onSaved={(session) => {
            setSessions((current) => {
              const exists = current.some((entry) => entry.id === session.id);
              return exists ? current.map((entry) => (entry.id === session.id ? session : entry)) : [session, ...current];
            });
            setActiveSessionId(session.id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {viewToggle}
      </div>
      {filterControls}
      {filteredItems.length === 0 ? (
        <EmptyState title="Nada para gravar no momento" description="Mova um conteúdo para Pronto para gravar ou Gravado." />
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <StatusBadge status={item.status} />
                    <PriorityBadge priority={item.priority} />
                  </div>
                  {item.recording_notes ? <p className="text-sm text-muted-foreground">{item.recording_notes}</p> : null}
                  <ItemChecklistToggle item={item} />
                </div>
                <MarkRecordedButton item={item} onDone={updateItem} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2 p-5 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="font-serif text-title">{item.title}</CardTitle>
                  <CampaignAssociationBadge campaignId={item.campaign_id} />
                  <StatusBadge status={item.status} />
                </div>
                {item.hook ? <p className="text-sm text-muted-foreground line-clamp-2">{item.hook}</p> : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-5 pt-0">
                <ItemChecklistToggle item={item} />
                <MarkRecordedButton item={item} onDone={updateItem} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
