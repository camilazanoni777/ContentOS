import type { ContentItem, ContentStatus, Json, SchedulingChecklist } from "@/types/domain";
import { EMPTY_SCHEDULING_CHECKLIST, SCHEDULING_CHECKLIST_KEYS } from "@/types/domain";

/**
 * Lógica pura da página Agendamento: parse do checklist final (jsonb em
 * content_items), filtros/busca da lista e a regra "não publicar sem data
 * real". Nada aqui toca o Supabase — só transforma dados já carregados.
 *
 * "Aprovados" (awaiting_approval -> aprovar) já chegam com status
 * "scheduled" — ver getNextEditingStatus em src/lib/editing.ts, cuja ação
 * "Aprovar" avança diretamente para scheduled. Por isso Agendamento
 * trabalha só sobre esse status.
 */

export const AGENDAMENTO_STATUSES: ContentStatus[] = ["scheduled"];

export function parseSchedulingChecklist(json: Json): SchedulingChecklist {
  const result: SchedulingChecklist = { ...EMPTY_SCHEDULING_CHECKLIST };
  if (!json || typeof json !== "object" || Array.isArray(json)) return result;
  const obj = json as Record<string, unknown>;
  for (const key of SCHEDULING_CHECKLIST_KEYS) {
    result[key] = obj[key] === true;
  }
  return result;
}

export function schedulingChecklistProgress(checklist: SchedulingChecklist): { checked: number; total: number } {
  const total = SCHEDULING_CHECKLIST_KEYS.length;
  const checked = SCHEDULING_CHECKLIST_KEYS.filter((key) => checklist[key]).length;
  return { checked, total };
}

export function isSchedulingChecklistComplete(checklist: SchedulingChecklist): boolean {
  return SCHEDULING_CHECKLIST_KEYS.every((key) => checklist[key]);
}

/**
 * Regra central desta página: nunca marcar "Publicado" sem uma data/hora
 * real de publicação. `publishedAt` é o valor que a usuária está prestes a
 * gravar (do formulário de "marcar como publicado"), não o published_at
 * atual do item — é essa validação que a Server Action reforça no
 * servidor (além do CHECK constraint no banco, ver migration
 * 20260904160000).
 */
export function canMarkAsPublished(publishedAt: string | null | undefined): boolean {
  return Boolean(publishedAt && publishedAt.trim());
}

/** URL do post pode faltar mesmo depois de publicado — mas deve ficar visível como pendência. */
export function isMissingPublishedUrl(item: Pick<ContentItem, "status" | "published_url">): boolean {
  return item.status === "published" && !item.published_url?.trim();
}

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export interface AgendamentoFilters {
  search: string;
  campaignId: string;
  productId: string;
  checklistIncomplete: boolean;
}

export const EMPTY_AGENDAMENTO_FILTERS: AgendamentoFilters = {
  search: "",
  campaignId: "",
  productId: "",
  checklistIncomplete: false,
};

export function filterAgendamentoItems(items: ContentItem[], filters: AgendamentoFilters): ContentItem[] {
  const needle = normalized(filters.search);
  return items.filter((item) => {
    if (filters.campaignId && item.campaign_id !== filters.campaignId) return false;
    if (filters.productId && item.product_id !== filters.productId) return false;
    if (filters.checklistIncomplete && isSchedulingChecklistComplete(parseSchedulingChecklist(item.scheduling_checklist))) {
      return false;
    }
    if (needle) {
      const haystack = normalized(
        [item.title, item.hook, item.caption, item.cta, ...(item.hashtags ?? [])].filter(Boolean).join(" "),
      );
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * Converte o texto livre do campo "palavras-chave/hashtags" (separado por
 * espaço e/ou vírgula) para o array armazenado em content_items.hashtags —
 * sempre sem o "#" (é reaplicado só na exibição) e sem duplicatas.
 */
export function parseHashtagsInput(text: string | null | undefined): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of text.split(/[\s,]+/)) {
    const tag = raw.trim().replace(/^#+/, "");
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    result.push(tag);
  }
  return result;
}

/** Inverso de parseHashtagsInput — para popular o campo de texto a partir do array salvo. */
export function formatHashtagsForInput(hashtags: string[] | null | undefined): string {
  return (hashtags ?? []).map((tag) => `#${tag}`).join(" ");
}

/** Ordena por data planejada mais próxima primeiro (sem data, por último). */
export function sortAgendamentoItems(items: ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => {
    if (!a.scheduled_at && !b.scheduled_at) return a.title.localeCompare(b.title, "pt-BR");
    if (!a.scheduled_at) return 1;
    if (!b.scheduled_at) return -1;
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });
}
