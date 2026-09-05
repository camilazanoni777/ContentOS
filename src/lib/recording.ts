import type {
  ContentItem,
  ContentStatus,
  Json,
  RecordingChecklist,
  RecordingSessionItem,
} from "@/types/domain";
import { EMPTY_RECORDING_CHECKLIST, RECORDING_CHECKLIST_KEYS } from "@/types/domain";

/**
 * Lógica pura da página Gravação: parse do checklist de gravação (jsonb em
 * content_items), filtros/busca da lista e ordenação de itens de uma
 * sessão em lote. Nada aqui toca o Supabase — só transforma dados já
 * carregados, para poder ser testado sem banco.
 */

export const GRAVACAO_STATUSES: ContentStatus[] = ["ready_to_record", "recorded"];

export function parseRecordingChecklist(json: Json): RecordingChecklist {
  const result: RecordingChecklist = { ...EMPTY_RECORDING_CHECKLIST };
  if (!json || typeof json !== "object" || Array.isArray(json)) return result;
  const obj = json as Record<string, unknown>;
  for (const key of RECORDING_CHECKLIST_KEYS) {
    result[key] = obj[key] === true;
  }
  return result;
}

export function recordingChecklistProgress(checklist: RecordingChecklist): { checked: number; total: number } {
  const total = RECORDING_CHECKLIST_KEYS.length;
  const checked = RECORDING_CHECKLIST_KEYS.filter((key) => checklist[key]).length;
  return { checked, total };
}

export function isRecordingChecklistComplete(checklist: RecordingChecklist): boolean {
  return RECORDING_CHECKLIST_KEYS.every((key) => checklist[key]);
}

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export interface GravacaoFilters {
  search: string;
  status: string;
  format: string;
  pillar: string;
}

export const EMPTY_GRAVACAO_FILTERS: GravacaoFilters = {
  search: "",
  status: "",
  format: "",
  pillar: "",
};

export function filterGravacaoItems(items: ContentItem[], filters: GravacaoFilters): ContentItem[] {
  const needle = normalized(filters.search);
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.format && normalized(item.format) !== normalized(filters.format)) return false;
    if (filters.pillar && item.pillar !== filters.pillar) return false;
    if (needle) {
      const haystack = normalized(
        [item.title, item.hook, item.pillar, item.recording_notes].filter(Boolean).join(" "),
      );
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * Ordena os itens de uma sessão pela posição de gravação (sort_order),
 * quebrando empate por data de inclusão — usada para exibir e para
 * recalcular sort_order após mover um item.
 */
export function sortSessionItems<T extends Pick<RecordingSessionItem, "sort_order" | "created_at">>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
}

/**
 * Move um id de uma posição para outra dentro de uma lista ordenada de ids
 * (ex.: resultado de um drag-and-drop) e devolve os pares { id, sortOrder }
 * já recalculados (0, 1, 2, ...) para persistir de uma vez. Função pura —
 * não depende de DOM nem de eventos do dnd-kit, só de índices.
 */
export function reorderSessionItemIds(
  orderedIds: string[],
  fromIndex: number,
  toIndex: number,
): { id: string; sortOrder: number }[] {
  if (
    fromIndex < 0 ||
    fromIndex >= orderedIds.length ||
    toIndex < 0 ||
    toIndex >= orderedIds.length ||
    fromIndex === toIndex
  ) {
    return orderedIds.map((id, index) => ({ id, sortOrder: index }));
  }
  const next = [...orderedIds];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((id, index) => ({ id, sortOrder: index }));
}

export function formatAvailableMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return "";
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

/** Formata segundos (cronômetro) como mm:ss ou h:mm:ss. */
export function formatStopwatch(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
