import type { ContentItem, ContentStatus, EditChecklist, EditVisualReference, Json } from "@/types/domain";
import { EDIT_CHECKLIST_KEYS, EMPTY_EDIT_CHECKLIST } from "@/types/domain";

/**
 * Lógica pura da página Edição: parse dos campos jsonb de content_items
 * (referências visuais, checklist de qualidade), atraso de prazo e
 * filtros/busca da lista. Nada aqui toca o Supabase.
 */

export const EDICAO_STATUSES: ContentStatus[] = ["recorded", "editing", "awaiting_approval"];

export function parseEditVisualReferences(json: Json): EditVisualReference[] {
  if (!Array.isArray(json)) return [];
  return json
    .map((raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const ref = raw as Record<string, unknown>;
      const label = typeof ref.label === "string" ? ref.label : "";
      const url = typeof ref.url === "string" ? ref.url : "";
      if (!label && !url) return null;
      return { label, url } satisfies EditVisualReference;
    })
    .filter((ref): ref is EditVisualReference => ref !== null);
}

export function parseEditChecklist(json: Json): EditChecklist {
  const result: EditChecklist = { ...EMPTY_EDIT_CHECKLIST };
  if (!json || typeof json !== "object" || Array.isArray(json)) return result;
  const obj = json as Record<string, unknown>;
  for (const key of EDIT_CHECKLIST_KEYS) {
    result[key] = obj[key] === true;
  }
  return result;
}

export function editChecklistProgress(checklist: EditChecklist): { checked: number; total: number } {
  const total = EDIT_CHECKLIST_KEYS.length;
  const checked = EDIT_CHECKLIST_KEYS.filter((key) => checklist[key]).length;
  return { checked, total };
}

export function isEditChecklistComplete(checklist: EditChecklist): boolean {
  return EDIT_CHECKLIST_KEYS.every((key) => checklist[key]);
}

/** Próximo status no fluxo de edição para os três botões de ação da página. */
export function getNextEditingStatus(status: ContentStatus): ContentStatus | null {
  if (status === "recorded") return "editing";
  if (status === "editing") return "awaiting_approval";
  if (status === "awaiting_approval") return "scheduled";
  return null;
}

export function isOverdue(item: Pick<ContentItem, "production_due_at" | "status">, now = new Date()): boolean {
  if (!item.production_due_at) return false;
  if (item.status === "published" || item.status === "canceled" || item.status === "scheduled") return false;
  return new Date(item.production_due_at).getTime() < now.getTime();
}

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export interface EdicaoFilters {
  search: string;
  status: string;
  editor: string;
  overdue: boolean;
}

export const EMPTY_EDICAO_FILTERS: EdicaoFilters = {
  search: "",
  status: "",
  editor: "",
  overdue: false,
};

export function filterEdicaoItems(items: ContentItem[], filters: EdicaoFilters, now = new Date()): ContentItem[] {
  const needle = normalized(filters.search);
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.editor && normalized(item.editor_name) !== normalized(filters.editor)) return false;
    if (filters.overdue && !isOverdue(item, now)) return false;
    if (needle) {
      const haystack = normalized(
        [item.title, item.hook, item.editor_name, item.editing_notes].filter(Boolean).join(" "),
      );
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function listEditors(items: ContentItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.editor_name?.trim()) set.add(item.editor_name.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
