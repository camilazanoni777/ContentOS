"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Archive,
  Columns3,
  GripVertical,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sparkles,
  Thermometer,
} from "lucide-react";

import { PriorityBadge } from "@/components/layout/priority-badge";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { CampaignAssociationBadge } from "@/features/negocio/campaign-association-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  quickUpdateContentIdea,
  updateContentStatus,
} from "@/lib/actions/content-items";
import {
  CONTENT_FORMATS,
  CONTENT_OBJECTIVES,
  EMPTY_IDEA_FILTERS,
  FORMAT_LABELS,
  LEVEL_LABELS,
  LEVEL_OPTIONS,
  OBJECTIVE_LABELS,
  calculateIdeaScore,
  filterIdeas,
  getBankStats,
  getIdeaAlerts,
  getPillarThermometer,
  getStalledDays,
  isReadyToRecord,
  sortIdeas,
  type IdeaFilters,
  type IdeaSort,
} from "@/lib/content-pipeline";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_ORDER, type ContentItem, type ContentSeries, type ContentStatus, type ContentStatusHistory } from "@/types/domain";
import { IdeaEditorDrawer } from "./idea-editor-drawer";

type ViewMode = "table" | "cards" | "kanban";
interface SavedFilter { id: string; name: string; filters: IdeaFilters; sort: IdeaSort }

const savedFiltersKey = "cami-content-os:idea-filters";
const activeKanbanStatuses = CONTENT_STATUS_ORDER;

function label(value: string | null, labels: Record<string, string>) {
  return value ? labels[value] ?? value : "—";
}

function Alerts({ item, history }: { item: ContentItem; history: ContentStatusHistory[] }) {
  const alerts = getIdeaAlerts(item, history);
  if (alerts.length === 0) return null;
  const labels = {
    stalled: "Parada há +45 dias",
    high_priority: "Alta prioridade sem ação",
    missing_pillar: "Sem pilar",
    missing_hook: "Sem gancho",
  };
  return (
    <div className="flex flex-wrap gap-1">
      {alerts.map((alert) => (
        <span key={alert} className="inline-flex items-center gap-1 rounded-full bg-tone-warning-bg px-2 py-1 text-[11px] font-medium text-tone-warning-fg">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />{labels[alert]}
        </span>
      ))}
    </div>
  );
}

function IdeaMeta({ item, history }: { item: ContentItem; history: ContentStatusHistory[] }) {
  const score = calculateIdeaScore(item);
  const days = getStalledDays(item, history);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Score <strong className="text-foreground">{score ?? "—"}</strong></span>
      <span>·</span><span>{days} {days === 1 ? "dia" : "dias"} parada</span>
      {isReadyToRecord(item) ? <Badge variant="accent"><Sparkles className="h-3 w-3" />Pronta para gravar</Badge> : null}
    </div>
  );
}

function QuickTitle({ item, onSave }: { item: ContentItem; onSave: (title: string) => void }) {
  const [value, setValue] = React.useState(item.title);
  return (
    <Input
      aria-label={`Título de ${item.title}`}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => value.trim() && value.trim() !== item.title && onSave(value.trim())}
      className="min-w-52 border-transparent bg-transparent px-1 font-medium shadow-none hover:border-input focus:border-input"
    />
  );
}

function StatusSelect({ item, onChange }: { item: ContentItem; onChange: (status: ContentStatus) => void }) {
  return (
    <Select aria-label={`Status de ${item.title}`} value={item.status} onChange={(event) => onChange(event.target.value as ContentStatus)} className="min-w-44">
      {CONTENT_STATUS_ORDER.map((status) => <option key={status} value={status}>{CONTENT_STATUS_LABELS[status]}</option>)}
    </Select>
  );
}

function TableView({ items, history, onEdit, onStatus, onQuick }: ViewProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr><th className="p-3">Ideia</th><th className="p-3">Status</th><th className="p-3">Pilar/formato</th><th className="p-3">Prioridade</th><th className="p-3">Score</th><th className="p-3">Dias parada</th><th className="p-3">Alertas</th><th className="p-3"><span className="sr-only">Ações</span></th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="align-top hover:bg-muted/30">
              <td className="p-2"><QuickTitle key={item.title} item={item} onSave={(title) => onQuick(item, { title })} />{item.hook ? <p className="max-w-xs px-1 text-xs text-muted-foreground line-clamp-2">{item.hook}</p> : null}<CampaignAssociationBadge campaignId={item.campaign_id}/></td>
              <td className="p-3"><StatusSelect item={item} onChange={(status) => onStatus(item, status)} /></td>
              <td className="p-3"><p>{item.pillar ?? "Sem pilar"}</p><p className="text-xs text-muted-foreground">{label(item.format, FORMAT_LABELS)}</p></td>
              <td className="p-3"><Select aria-label={`Prioridade de ${item.title}`} value={item.priority ?? ""} onChange={(event) => onQuick(item, { priority: event.target.value || null })}><option value="">Não definida</option>{LEVEL_OPTIONS.map((value) => <option key={value} value={value}>{LEVEL_LABELS[value]}</option>)}</Select></td>
              <td className="p-3 font-semibold">{calculateIdeaScore(item) ?? "—"}</td>
              <td className="p-3">{getStalledDays(item, history)}</td>
              <td className="max-w-xs p-3"><Alerts item={item} history={history} /></td>
              <td className="p-3"><Button size="sm" variant="outline" onClick={() => onEdit(item)}>Editar</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ViewProps {
  items: ContentItem[];
  history: ContentStatusHistory[];
  onEdit: (item: ContentItem) => void;
  onStatus: (item: ContentItem, status: ContentStatus) => void;
  onQuick: (item: ContentItem, patch: { title?: string; priority?: string | null }) => void;
}

function IdeaCard({ item, history, onEdit }: Pick<ViewProps, "history" | "onEdit"> & { item: ContentItem }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-3 p-5 pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="font-serif text-title">{item.title}</CardTitle><StatusBadge status={item.status} /></div><CampaignAssociationBadge campaignId={item.campaign_id}/>{item.hook ? <p className="text-sm text-muted-foreground line-clamp-3">{item.hook}</p> : null}</CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3 p-5 pt-0">
        <div className="flex flex-wrap gap-2"><PriorityBadge priority={item.priority} />{item.pillar ? <Badge variant="outline">{item.pillar}</Badge> : null}{item.format ? <Badge variant="secondary">{label(item.format, FORMAT_LABELS)}</Badge> : null}</div>
        <IdeaMeta item={item} history={history} /><Alerts item={item} history={history} />
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>Editar ideia</Button>
      </CardContent>
    </Card>
  );
}

function CardsView(props: ViewProps) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{props.items.map((item) => <IdeaCard key={item.id} item={item} history={props.history} onEdit={props.onEdit} />)}</div>;
}

function DraggableIdea({ item, history, onEdit }: { item: ContentItem; history: ContentStatusHistory[]; onEdit: (item: ContentItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} className={`rounded-lg border border-border bg-card p-3 shadow-sm ${isDragging ? "z-10 opacity-60" : ""}`}>
      <div className="flex items-start gap-2"><button type="button" className="mt-0.5 cursor-grab text-muted-foreground" aria-label={`Arrastar ${item.title}`} {...listeners} {...attributes}><GripVertical className="h-4 w-4" /></button><button type="button" className="flex-1 text-left text-sm font-semibold" onClick={() => onEdit(item)}>{item.title}</button></div>
      <div className="mt-2"><IdeaMeta item={item} history={history} /></div>
      <div className="mt-2"><Alerts item={item} history={history} /></div>
    </div>
  );
}

function KanbanColumn({ status, items, history, onEdit }: { status: ContentStatus; items: ContentItem[]; history: ContentStatusHistory[]; onEdit: (item: ContentItem) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={`w-72 shrink-0 rounded-xl border p-3 transition-colors ${isOver ? "border-primary bg-secondary" : "border-border bg-muted/30"}`}>
      <div className="mb-3 flex items-center justify-between"><StatusBadge status={status} /><Badge variant="outline">{items.length}</Badge></div>
      <div className="flex min-h-32 flex-col gap-2">{items.map((item) => <DraggableIdea key={item.id} item={item} history={history} onEdit={onEdit} />)}</div>
    </section>
  );
}

function KanbanView(props: ViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  function onDragEnd(event: DragEndEvent) {
    const item = props.items.find((entry) => entry.id === event.active.id);
    const status = event.over?.id as ContentStatus | undefined;
    if (item && status && CONTENT_STATUS_ORDER.includes(status) && item.status !== status) props.onStatus(item, status);
  }
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto pb-3"><div className="flex min-w-max gap-3">{activeKanbanStatuses.map((status) => <KanbanColumn key={status} status={status} items={props.items.filter((item) => item.status === status)} history={props.history} onEdit={props.onEdit} />)}</div></div>
    </DndContext>
  );
}

export function IdeasWorkspace({ initialItems, initialHistory, series, configuredPillars = [] }: { initialItems: ContentItem[]; initialHistory: ContentStatusHistory[]; series: ContentSeries[]; configuredPillars?: string[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [history, setHistory] = React.useState(initialHistory);
  const [view, setView] = React.useState<ViewMode>("table");
  const [filters, setFilters] = React.useState<IdeaFilters>(EMPTY_IDEA_FILTERS);
  const [sort, setSort] = React.useState<IdeaSort>("updated_desc");
  const [showFilters, setShowFilters] = React.useState(false);
  const [savedFilters, setSavedFilters] = React.useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = React.useState("");
  const [editing, setEditing] = React.useState<ContentItem | null>(null);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      try { setSavedFilters(JSON.parse(localStorage.getItem(savedFiltersKey) ?? "[]")); } catch { setSavedFilters([]); }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const visible = React.useMemo(() => sortIdeas(filterIdeas(items, history, filters), history, sort), [items, history, filters, sort]);
  const stats = React.useMemo(() => getBankStats(items, history), [items, history]);
  const pillars = React.useMemo(() => [...new Set([...configuredPillars, ...items.map((item) => item.pillar).filter((value): value is string => Boolean(value))])].sort(), [configuredPillars, items]);
  const thermometer = React.useMemo(() => getPillarThermometer(items, configuredPillars), [items, configuredPillars]);

  function updateFilter<K extends keyof IdeaFilters>(key: K, value: IdeaFilters[K]) { setFilters((current) => ({ ...current, [key]: value })); }
  function replaceItem(next: ContentItem) { setItems((current) => current.map((item) => item.id === next.id ? next : item)); }

  async function changeStatus(item: ContentItem, status: ContentStatus) {
    const before = item;
    replaceItem({ ...item, status, updated_at: new Date().toISOString() });
    const result = await updateContentStatus(item.id, status);
    if ("error" in result) { replaceItem(before); setError(result.error); return; }
    replaceItem(result.item);
    setHistory((current) => [...current, { id: `local-${Date.now()}`, content_item_id: item.id, user_id: item.user_id, previous_status: item.status, new_status: status, changed_at: new Date().toISOString() }]);
    router.refresh();
  }

  async function quickUpdate(item: ContentItem, patch: { title?: string; priority?: string | null }) {
    const before = item;
    replaceItem({ ...item, ...patch, updated_at: new Date().toISOString() });
    const result = await quickUpdateContentIdea(item.id, patch);
    if ("error" in result) { replaceItem(before); setError(result.error); return; }
    replaceItem(result.item);
    router.refresh();
  }

  function saveFilter() {
    const name = filterName.trim();
    if (!name) return;
    const next = [...savedFilters, { id: crypto.randomUUID(), name, filters, sort }];
    setSavedFilters(next); localStorage.setItem(savedFiltersKey, JSON.stringify(next)); setFilterName("");
  }

  function openEditor(item: ContentItem | null) { setEditing(item); setEditorOpen(true); }
  function handleEditorSaved(next: ContentItem) {
    const previous = items.find((item) => item.id === next.id);
    setItems((current) => current.some((item) => item.id === next.id)
      ? current.map((item) => item.id === next.id ? next : item)
      : [next, ...current]);
    if (!previous || previous.status !== next.status) {
      setHistory((current) => [...current, {
        id: `local-${Date.now()}`,
        content_item_id: next.id,
        user_id: next.user_id,
        previous_status: previous?.status ?? null,
        new_status: next.status,
        changed_at: new Date().toISOString(),
      }]);
    }
    router.refresh();
  }
  const viewProps: ViewProps = { items: visible, history, onEdit: (item) => openEditor(item), onStatus: changeStatus, onQuick: quickUpdate };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total de ideias" value={stats.total} />
        <StatCard label="Prontas para gravar" value={stats.ready} />
        <StatCard label="Alta prioridade" value={stats.highPriority} />
        <StatCard label="Paradas +45 dias" value={stats.stalled} />
        <StatCard label="Publicadas" value={stats.published} />
        <StatCard label="Podem virar série" value={stats.series} />
      </div>

      <Card>
        <CardHeader className="p-5 pb-3"><CardTitle className="flex items-center gap-2 font-serif"><Thermometer className="h-5 w-5 text-primary" />Termômetro do banco por pilar</CardTitle></CardHeader>
        <CardContent className="grid gap-3 p-5 pt-0 sm:grid-cols-2 lg:grid-cols-3">
          {thermometer.length ? thermometer.map(({ pillar, count, understocked }) => (
            <div key={pillar} className="rounded-lg border border-border p-3"><div className="flex justify-between text-sm"><span className="font-medium">{pillar}</span><span>{count} {count === 1 ? "ideia" : "ideias"}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${understocked ? "bg-tone-warning-fg" : "bg-tone-success-fg"}`} style={{ width: `${Math.min(100, (count / 3) * 100)}%` }} /></div>{understocked ? <p className="mt-1 text-xs text-tone-warning-fg">Menos de 3 ideias disponíveis</p> : null}</div>
          )) : <p className="text-sm text-muted-foreground">Defina pilares nas ideias para acompanhar o equilíbrio do banco.</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar ideias" value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="Buscar título, gancho, referência, tag..." className="pl-9" /></div>
          <Select aria-label="Ordenar ideias" value={sort} onChange={(e) => setSort(e.target.value as IdeaSort)} className="lg:w-52"><option value="updated_desc">Mais recentes</option><option value="score_desc">Maior score</option><option value="stalled_desc">Mais paradas</option><option value="priority_desc">Maior prioridade</option><option value="title_asc">Título A–Z</option></Select>
          <Button variant="outline" onClick={() => setShowFilters((value) => !value)}>Filtros</Button>
          <div className="flex rounded-md border border-input p-1" aria-label="Visualização">
            {([{ value: "table", icon: List, label: "Tabela" }, { value: "cards", icon: LayoutGrid, label: "Cards" }, { value: "kanban", icon: Columns3, label: "Kanban" }] as const).map(({ value, icon: Icon, label }) => <Button key={value} size="icon" variant={view === value ? "secondary" : "ghost"} aria-label={label} onClick={() => setView(value)}><Icon /></Button>)}
          </div>
          <Button onClick={() => openEditor(null)}><Plus />Nova ideia</Button>
        </div>

        {showFilters ? <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Select aria-label="Filtrar por status" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}><option value="">Todos os status</option>{CONTENT_STATUS_ORDER.map((status) => <option key={status} value={status}>{CONTENT_STATUS_LABELS[status]}</option>)}</Select>
          <Select aria-label="Filtrar por pilar" value={filters.pillar} onChange={(e) => updateFilter("pillar", e.target.value)}><option value="">Todos os pilares</option>{pillars.map((pillar) => <option key={pillar}>{pillar}</option>)}</Select>
          <Select aria-label="Filtrar por formato" value={filters.format} onChange={(e) => updateFilter("format", e.target.value)}><option value="">Todos os formatos</option>{CONTENT_FORMATS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</Select>
          <Select aria-label="Filtrar por objetivo" value={filters.objective} onChange={(e) => updateFilter("objective", e.target.value)}><option value="">Todos os objetivos</option>{CONTENT_OBJECTIVES.map((value) => <option key={value} value={value}>{OBJECTIVE_LABELS[value]}</option>)}</Select>
          <Select aria-label="Filtrar por potencial" value={filters.potential} onChange={(e) => updateFilter("potential", e.target.value)}><option value="">Todo potencial</option>{["alto", "medio", "baixo"].map((value) => <option key={value} value={value}>{LEVEL_LABELS[value]}</option>)}</Select>
          <Select aria-label="Filtrar por facilidade" value={filters.productionEase} onChange={(e) => updateFilter("productionEase", e.target.value)}><option value="">Toda facilidade</option>{LEVEL_OPTIONS.map((value) => <option key={value} value={value}>{LEVEL_LABELS[value]}</option>)}</Select>
          <Select aria-label="Filtrar por prioridade" value={filters.priority} onChange={(e) => updateFilter("priority", e.target.value)}><option value="">Toda prioridade</option>{LEVEL_OPTIONS.map((value) => <option key={value} value={value}>{LEVEL_LABELS[value]}</option>)}</Select>
          <Select aria-label="Filtrar por alerta" value={filters.alert} onChange={(e) => updateFilter("alert", e.target.value)}><option value="">Todos os alertas</option><option value="stalled">Paradas +45 dias</option><option value="high_priority">Alta prioridade sem ação</option><option value="missing_pillar">Sem pilar</option><option value="missing_hook">Sem gancho</option></Select>
          <Select aria-label="Filtrar por série" value={filters.series} onChange={(e) => updateFilter("series", e.target.value)}><option value="">Pode virar série: todos</option><option value="yes">Sim</option><option value="no">Não</option></Select>
          <Select aria-label="Filtrar arquivo" value={filters.archive} onChange={(e) => updateFilter("archive", e.target.value as IdeaFilters["archive"])}><option value="active">Ativas</option><option value="archived">Arquivadas</option><option value="all">Todas</option></Select>
          <Button variant="ghost" onClick={() => setFilters(EMPTY_IDEA_FILTERS)}>Limpar filtros</Button>
        </div> : null}

        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center">
          <Input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Nome deste filtro" aria-label="Nome do filtro salvo" className="sm:max-w-52" />
          <Button size="sm" variant="outline" onClick={saveFilter} disabled={!filterName.trim()}>Salvar filtro</Button>
          {savedFilters.length ? <Select aria-label="Aplicar filtro salvo" defaultValue="" onChange={(e) => { const selected = savedFilters.find((entry) => entry.id === e.target.value); if (selected) { setFilters(selected.filters); setSort(selected.sort); } }} className="sm:max-w-64"><option value="">Aplicar filtro salvo...</option>{savedFilters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</Select> : null}
          <span className="ml-auto text-xs text-muted-foreground">{visible.length} de {items.length} registros</span>
        </div>
      </div>

      {error ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
      {visible.length === 0 ? <div className="rounded-xl border border-dashed border-border py-14 text-center"><Archive className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><p className="font-medium">Nenhuma ideia neste recorte</p><p className="text-sm text-muted-foreground">Ajuste os filtros ou crie uma nova ideia.</p></div> : view === "table" ? <TableView {...viewProps} /> : view === "cards" ? <CardsView {...viewProps} /> : <KanbanView {...viewProps} />}

      {editorOpen ? <IdeaEditorDrawer open={editorOpen} onOpenChange={setEditorOpen} item={editing} series={series} onSaved={handleEditorSaved} onDeleted={(id) => { setItems((current) => current.filter((item) => item.id !== id)); setHistory((current) => current.filter((entry) => entry.content_item_id !== id)); router.refresh(); }} /> : null}
    </div>
  );
}
