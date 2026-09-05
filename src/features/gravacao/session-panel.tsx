"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Check, GripVertical, Trash2 } from "lucide-react";

import { PriorityBadge } from "@/components/layout/priority-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/states";
import { removeItemFromSession, reorderSessionItems, markAsRecorded } from "@/lib/actions/recording";
import { formatAvailableMinutes, reorderSessionItemIds } from "@/lib/recording";
import { RECORDING_CHECKLIST_LABELS, type RecordingSession } from "@/types/domain";
import type { RecordingSessionItemWithContent } from "@/lib/data/recording-sessions";
import { parseRecordingChecklist, recordingChecklistProgress } from "@/lib/recording";
import { Stopwatch } from "./stopwatch";

interface SessionPanelProps {
  session: RecordingSession;
  items: RecordingSessionItemWithContent[];
  onItemsChange: (items: RecordingSessionItemWithContent[]) => void;
  onEdit: () => void;
}

function SortableRow({
  entry,
  onRemove,
  onMarkRecorded,
}: {
  entry: RecordingSessionItemWithContent;
  onRemove: () => void;
  onMarkRecorded: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const checklist = parseRecordingChecklist(entry.content_item.recording_checklist);
  const progress = recordingChecklistProgress(checklist);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 rounded-lg border border-border bg-card p-3 ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={`Arrastar para reordenar ${entry.content_item.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <Link href={`/roteiros/${entry.content_item.id}`} className="font-medium hover:underline">
            {entry.content_item.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <PriorityBadge priority={entry.content_item.priority} />
            <span>Checklist {progress.checked}/{progress.total}</span>
            {entry.content_item.status === "recorded" ? <span className="text-tone-success-fg">Gravado</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {entry.content_item.status !== "recorded" ? (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onMarkRecorded}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Gravado
            </Button>
          ) : null}
          <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label={`Remover ${entry.content_item.title} da sessão`}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Painel de uma sessão de gravação em lote: itens ordenáveis (arrastar ou
 * pelos botões subir/descer — mesmo resultado, para funcionar bem também no
 * mobile/teclado), checklist por conteúdo (resumo aqui; o checklist
 * completo abre no workspace de Roteiros do próprio conteúdo) e cronômetro
 * opcional.
 */
export function SessionPanel({ session, items, onItemsChange, onEdit }: SessionPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [error, setError] = React.useState<string | null>(null);

  const orderedIds = items.map((entry) => entry.id);

  async function persistOrder(nextItems: RecordingSessionItemWithContent[]) {
    onItemsChange(nextItems);
    const updates = nextItems.map((entry, index) => ({ id: entry.id, sortOrder: index }));
    const result = await reorderSessionItems(updates);
    if ("error" in result) setError(result.error);
  }

  function moveBy(index: number, delta: number) {
    const toIndex = index + delta;
    if (toIndex < 0 || toIndex >= items.length) return;
    const order = reorderSessionItemIds(orderedIds, index, toIndex);
    const nextItems = order
      .map((entry) => items.find((item) => item.id === entry.id))
      .filter((item): item is RecordingSessionItemWithContent => Boolean(item));
    void persistOrder(nextItems);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = orderedIds.indexOf(String(active.id));
    const toIndex = orderedIds.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;
    const order = reorderSessionItemIds(orderedIds, fromIndex, toIndex);
    const nextItems = order
      .map((entry) => items.find((item) => item.id === entry.id))
      .filter((item): item is RecordingSessionItemWithContent => Boolean(item));
    void persistOrder(nextItems);
  }

  async function handleRemove(sessionItemId: string) {
    const result = await removeItemFromSession(sessionItemId);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onItemsChange(items.filter((entry) => entry.id !== sessionItemId));
  }

  async function handleMarkRecorded(contentItemId: string) {
    const result = await markAsRecorded(contentItemId);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onItemsChange(
      items.map((entry) => (entry.content_item.id === contentItemId ? { ...entry, content_item: result.item } : entry)),
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">
            {session.session_date ? new Date(`${session.session_date}T00:00:00`).toLocaleDateString("pt-BR") : "Sem data definida"}
            {session.location ? ` — ${session.location}` : ""}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {[session.scenario, session.outfit].filter(Boolean).join(" · ") || "Cenário/roupa não definidos"}
            {session.available_minutes ? ` · ${formatAvailableMinutes(session.available_minutes)} disponíveis` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Stopwatch />
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            Editar sessão
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Arraste (ou use os botões) para ordenar a gravação e reduzir trocas de cenário/roupa. Checklist completo (
          {Object.values(RECORDING_CHECKLIST_LABELS).length} itens) fica no workspace de cada conteúdo.
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {items.length === 0 ? (
          <EmptyState title="Nenhum conteúdo nesta sessão" description="Adicione conteúdos pela lista ao lado." />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {items.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-1">
                    <div className="flex flex-col">
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => moveBy(index, -1)} aria-label="Mover para cima">
                        <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={index === items.length - 1} onClick={() => moveBy(index, 1)} aria-label="Mover para baixo">
                        <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <SortableRow
                        entry={entry}
                        onRemove={() => handleRemove(entry.id)}
                        onMarkRecorded={() => handleMarkRecorded(entry.content_item.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
