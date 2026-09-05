"use client";

import * as React from "react";
import Link from "next/link";
import { addMonths, subMonths } from "date-fns";
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
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/layout/filter-bar";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { rescheduleContent } from "@/lib/actions/calendario";
import {
  EMPTY_CALENDAR_FILTERS,
  buildMonthGrid,
  filterCalendarItems,
  isDraggable,
  isEmptyDay,
  isExcessDay,
  summarizeMonth,
  type CalendarDay,
  type CalendarFilters,
} from "@/lib/calendario";
import { changeInstantDate, toISODate } from "@/lib/dates";
import { ImportantDateDialog } from "@/features/planejamento/important-date-dialog";
import { CONTENT_FORMATS, OBJECTIVE_LABELS } from "@/lib/content-pipeline";
import type { Campaign, CalendarImportantDate, ContentItem } from "@/types/domain";

interface CalendarMonthViewProps {
  monthISO: string;
  today: string;
  initialItems: ContentItem[];
  initialImportantDates: CalendarImportantDate[];
  campaigns: Campaign[];
}

function monthLabel(monthISO: string): string {
  return new Date(`${monthISO}T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function DraggableItemChip({ item }: { item: ContentItem }) {
  const draggable = isDraggable(item);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !draggable,
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 truncate rounded-md border border-border bg-card px-1.5 py-1 text-[11px] ${draggable ? "cursor-grab touch-none active:cursor-grabbing" : "opacity-80"} ${isDragging ? "z-20 opacity-60 shadow-lg" : ""}`}
      {...(draggable ? { ...attributes, ...listeners } : {})}
    >
      <StatusBadge status={item.status} className="px-1.5 py-0.5 text-[10px]" />
      <span className="truncate">{item.title}</span>
    </div>
  );
}

function DroppableDayCell({
  day,
  onAddImportantDate,
  onEditImportantDate,
}: {
  day: CalendarDay;
  onAddImportantDate: (date: string) => void;
  onEditImportantDate: (date: CalendarImportantDate) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day.date });
  const empty = isEmptyDay(day);
  const excess = isExcessDay(day);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-28 flex-col gap-1.5 rounded-lg border p-1.5 ${day.inCurrentMonth ? "border-border bg-card" : "border-border/50 bg-muted/30"} ${isOver ? "ring-2 ring-ring" : ""} ${day.isToday ? "border-primary" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${day.inCurrentMonth ? "" : "text-muted-foreground"}`}>
          {new Date(`${day.date}T00:00:00`).getDate()}
        </span>
        <div className="flex items-center gap-1">
          {empty ? <span title="Dia vazio" className="h-1.5 w-1.5 rounded-full bg-tone-neutral-fg" /> : null}
          {excess ? (
            <span title="Excesso de publicações neste dia">
              <AlertTriangle className="h-3 w-3 text-tone-warning-fg" aria-hidden="true" />
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onAddImportantDate(day.date)}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={`Adicionar data importante em ${day.date}`}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>
      {day.importantDates.map((important) => (
        <button
          key={important.id}
          type="button"
          onClick={() => onEditImportantDate(important)}
          className="flex items-center gap-1 truncate rounded-md bg-tone-info-bg px-1.5 py-0.5 text-left text-[11px] text-tone-info-fg"
        >
          <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{important.label}</span>
        </button>
      ))}
      <div className="flex flex-col gap-1">
        {day.items.map((item) => (
          <DraggableItemChip key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function CalendarMonthView({ monthISO, today, initialItems, initialImportantDates, campaigns }: CalendarMonthViewProps) {
  const [items, setItems] = React.useState(initialItems);
  const [importantDates, setImportantDates] = React.useState(initialImportantDates);
  const [filters, setFilters] = React.useState<CalendarFilters>(EMPTY_CALENDAR_FILTERS);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<{ open: boolean; date: string; existing: CalendarImportantDate | null }>({
    open: false,
    date: today,
    existing: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const pillars = React.useMemo(() => {
    const set = new Set<string>();
    for (const item of items) if (item.pillar?.trim()) set.add(item.pillar.trim());
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const filtered = filterCalendarItems(items, filters);
  const days = buildMonthGrid(monthISO, filtered, importantDates, today);
  const summary = summarizeMonth(days);

  const monthDate = new Date(`${monthISO}T00:00:00`);
  const prevMonth = toISODate(subMonths(monthDate, 1));
  const nextMonth = toISODate(addMonths(monthDate, 1));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const contentItemId = String(active.id);
    const newDateISO = String(over.id);
    const current = items.find((item) => item.id === contentItemId);
    if (!current || !isDraggable(current)) return;

    const previousScheduledAt = current.scheduled_at;
    const optimisticScheduledAt = changeInstantDate(previousScheduledAt, newDateISO);
    setItems((currentItems) => currentItems.map((item) => (item.id === contentItemId ? { ...item, scheduled_at: optimisticScheduledAt } : item)));

    const result = await rescheduleContent({ contentItemId, newDateISO });
    if ("error" in result) {
      setError(result.error);
      setItems((currentItems) => currentItems.map((item) => (item.id === contentItemId ? { ...item, scheduled_at: previousScheduledAt } : item)));
      return;
    }
    setError(null);
    setItems((currentItems) => currentItems.map((item) => (item.id === contentItemId ? result.item : item)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/planejamento/calendario?month=${prevMonth}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground" aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="text-sm font-medium capitalize">{monthLabel(monthISO)}</span>
          <Link href={`/planejamento/calendario?month=${nextMonth}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground" aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setDialogState({ open: true, date: today, existing: null })}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Data importante
        </Button>
      </div>

      <FilterBar>
        <Select value={filters.format} onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value }))} className="sm:w-40" aria-label="Filtrar por formato">
          <option value="">Todos os formatos</option>
          {CONTENT_FORMATS.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </Select>
        {pillars.length > 0 ? (
          <Select value={filters.pillar} onChange={(event) => setFilters((current) => ({ ...current, pillar: event.target.value }))} className="sm:w-40" aria-label="Filtrar por pilar">
            <option value="">Todos os pilares</option>
            {pillars.map((pillar) => (
              <option key={pillar} value={pillar}>
                {pillar}
              </option>
            ))}
          </Select>
        ) : null}
        <Select value={filters.objective} onChange={(event) => setFilters((current) => ({ ...current, objective: event.target.value }))} className="sm:w-40" aria-label="Filtrar por objetivo">
          <option value="">Todos os objetivos</option>
          {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="sm:w-40" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="scheduled">Agendado</option>
          <option value="published">Publicado</option>
        </Select>
        {campaigns.length > 0 ? (
          <Select value={filters.campaignId} onChange={(event) => setFilters((current) => ({ ...current, campaignId: event.target.value }))} className="sm:w-44" aria-label="Filtrar por campanha">
            <option value="">Todas as campanhas</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        ) : null}
      </FilterBar>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {items.length === 0 ? (
        <EmptyState title="Nenhum conteúdo agendado neste mês" description="Conteúdos com data de agendamento definida aparecem aqui, organizados por dia." />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => (
              <DroppableDayCell
                key={day.date}
                day={day}
                onAddImportantDate={(date) => setDialogState({ open: true, date, existing: null })}
                onEditImportantDate={(existing) => setDialogState({ open: true, date: existing.event_date, existing })}
              />
            ))}
          </div>
        </DndContext>
      )}

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium">Resumo do mês por formato</h3>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {summary.byFormat.length === 0 ? <li>Sem conteúdos neste mês.</li> : null}
              {summary.byFormat.map((entry) => (
                <li key={entry.key} className="flex justify-between">
                  <span>{entry.key}</span>
                  <span>{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Resumo do mês por pilar</h3>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {summary.byPillar.length === 0 ? <li>Sem conteúdos neste mês.</li> : null}
              {summary.byPillar.map((entry) => (
                <li key={entry.key} className="flex justify-between">
                  <span>{entry.key}</span>
                  <span>{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <ImportantDateDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((current) => ({ ...current, open }))}
        defaultDate={dialogState.date}
        date={dialogState.existing}
        onSaved={(saved) =>
          setImportantDates((current) => {
            const exists = current.some((entry) => entry.id === saved.id);
            return exists ? current.map((entry) => (entry.id === saved.id ? saved : entry)) : [...current, saved];
          })
        }
        onDeleted={(id) => setImportantDates((current) => current.filter((entry) => entry.id !== id))}
      />
    </div>
  );
}
