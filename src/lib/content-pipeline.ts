import { differenceInCalendarDays } from "date-fns";

import type { ContentItem, ContentStatus, ContentStatusHistory } from "@/types/domain";

export const CONTENT_FORMATS = [
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carrossel" },
  { value: "photo", label: "Foto" },
  { value: "stories", label: "Stories" },
  { value: "live", label: "Live" },
] as const;

export const CONTENT_OBJECTIVES = [
  "alcance",
  "viralizacao",
  "compartilhamentos",
  "engajamento",
  "seguidores",
  "comunidade",
  "autoridade",
  "trafego",
  "leads",
  "vendas",
  "entretenimento",
] as const;

export const LEVEL_OPTIONS = ["alta", "media", "baixa"] as const;

export const LEVEL_LABELS: Record<string, string> = {
  alto: "Alto",
  alta: "Alta",
  medio: "Médio",
  media: "Média",
  baixo: "Baixo",
  baixa: "Baixa",
};

export const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((format) => [format.value, format.label]),
) as Record<string, string>;

export const OBJECTIVE_LABELS: Record<string, string> = {
  alcance: "Alcance",
  viralizacao: "Viralização",
  compartilhamentos: "Compartilhamentos",
  engajamento: "Engajamento",
  seguidores: "Seguidores",
  comunidade: "Comunidade",
  autoridade: "Autoridade",
  trafego: "Tráfego",
  leads: "Leads",
  vendas: "Vendas",
  entretenimento: "Entretenimento",
};

const levelScore: Record<string, number> = {
  alto: 3,
  alta: 3,
  medio: 2,
  media: 2,
  baixo: 1,
  baixa: 1,
};

const priorityMultiplier: Record<string, number> = {
  alta: 1.2,
  media: 1,
  baixa: 0.8,
};

export type IdeaAlert = "stalled" | "high_priority" | "missing_pillar" | "missing_hook";

export interface IdeaFilters {
  search: string;
  status: string;
  pillar: string;
  format: string;
  objective: string;
  potential: string;
  productionEase: string;
  priority: string;
  alert: string;
  series: string;
  archive: "active" | "archived" | "all";
}

export type IdeaSort = "updated_desc" | "score_desc" | "stalled_desc" | "priority_desc" | "title_asc";

export const EMPTY_IDEA_FILTERS: IdeaFilters = {
  search: "",
  status: "",
  pillar: "",
  format: "",
  objective: "",
  potential: "",
  productionEase: "",
  priority: "",
  alert: "",
  series: "",
  archive: "active",
};

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function calculateIdeaScore(item: Pick<ContentItem, "potential" | "production_ease" | "priority">): number | null {
  const potential = levelScore[normalized(item.potential)];
  const ease = levelScore[normalized(item.production_ease)];
  if (!potential || !ease) return null;

  const multiplier = priorityMultiplier[normalized(item.priority)] ?? 1;
  return Number(((potential * 2 + ease) * multiplier).toFixed(1));
}

export function getLastStatusChange(
  item: Pick<ContentItem, "id" | "created_at">,
  history: ContentStatusHistory[],
): Date {
  const latest = history
    .filter((entry) => entry.content_item_id === item.id)
    .reduce<string | null>((current, entry) => {
      if (!current || new Date(entry.changed_at) > new Date(current)) return entry.changed_at;
      return current;
    }, null);
  return new Date(latest ?? item.created_at);
}

export function getStalledDays(
  item: Pick<ContentItem, "id" | "created_at">,
  history: ContentStatusHistory[],
  now = new Date(),
): number {
  return Math.max(0, differenceInCalendarDays(now, getLastStatusChange(item, history)));
}

export function isReadyToRecord(item: Pick<ContentItem, "status" | "hook" | "format">): boolean {
  return item.status === "ready_to_record" && Boolean(item.hook?.trim()) && Boolean(item.format?.trim());
}

export function getIdeaAlerts(
  item: ContentItem,
  history: ContentStatusHistory[],
  now = new Date(),
): IdeaAlert[] {
  const alerts: IdeaAlert[] = [];
  const days = getStalledDays(item, history, now);
  if (days > 45 && item.status !== "published" && item.status !== "canceled") alerts.push("stalled");
  if (
    normalized(item.priority) === "alta" &&
    ["idea", "researching"].includes(item.status) &&
    !item.planned_at &&
    !item.production_due_at
  ) {
    alerts.push("high_priority");
  }
  if (!item.pillar?.trim()) alerts.push("missing_pillar");
  if (!item.hook?.trim()) alerts.push("missing_hook");
  return alerts;
}

export function canTransitionContentStatus(from: ContentStatus, to: ContentStatus): boolean {
  return from !== to;
}

export function filterIdeas(
  items: ContentItem[],
  history: ContentStatusHistory[],
  filters: IdeaFilters,
  now = new Date(),
): ContentItem[] {
  const needle = normalized(filters.search);
  return items.filter((item) => {
    const archived = Boolean(item.archived_at);
    if (filters.archive === "active" && archived) return false;
    if (filters.archive === "archived" && !archived) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.pillar && item.pillar !== filters.pillar) return false;
    if (filters.format && normalized(item.format) !== normalized(filters.format)) return false;
    if (filters.objective && normalized(item.objective) !== normalized(filters.objective)) return false;
    if (filters.potential && normalized(item.potential) !== normalized(filters.potential)) return false;
    if (filters.productionEase && normalized(item.production_ease) !== normalized(filters.productionEase)) return false;
    if (filters.priority && normalized(item.priority) !== normalized(filters.priority)) return false;
    if (filters.series === "yes" && !item.can_be_series) return false;
    if (filters.series === "no" && item.can_be_series) return false;
    if (filters.alert && !getIdeaAlerts(item, history, now).includes(filters.alert as IdeaAlert)) return false;

    if (needle) {
      const haystack = normalized([
        item.title,
        item.hook,
        item.summary,
        item.pillar,
        item.reference_text,
        item.reference_url,
        item.audience_intent,
        item.cta,
        item.notes,
        ...item.tags,
      ].filter(Boolean).join(" "));
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function sortIdeas(
  items: ContentItem[],
  history: ContentStatusHistory[],
  sort: IdeaSort,
  now = new Date(),
): ContentItem[] {
  return [...items].sort((a, b) => {
    if (sort === "title_asc") return a.title.localeCompare(b.title, "pt-BR");
    if (sort === "score_desc") return (calculateIdeaScore(b) ?? -1) - (calculateIdeaScore(a) ?? -1);
    if (sort === "stalled_desc") return getStalledDays(b, history, now) - getStalledDays(a, history, now);
    if (sort === "priority_desc") {
      return (priorityMultiplier[normalized(b.priority)] ?? 0) - (priorityMultiplier[normalized(a.priority)] ?? 0);
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function getBankStats(items: ContentItem[], history: ContentStatusHistory[], now = new Date()) {
  const active = items.filter((item) => !item.archived_at);
  return {
    total: active.length,
    ready: active.filter(isReadyToRecord).length,
    highPriority: active.filter((item) => normalized(item.priority) === "alta").length,
    stalled: active.filter((item) => getIdeaAlerts(item, history, now).includes("stalled")).length,
    published: active.filter((item) => item.status === "published").length,
    series: active.filter((item) => item.can_be_series).length,
  };
}

export function getPillarThermometer(items: ContentItem[], knownPillars: string[] = []) {
  const available = items.filter(
    (item) => !item.archived_at && !["published", "canceled"].includes(item.status) && Boolean(item.pillar?.trim()),
  );
  const counts = new Map<string, number>(knownPillars.filter(Boolean).map((pillar) => [pillar, 0]));
  for (const item of available) counts.set(item.pillar as string, (counts.get(item.pillar as string) ?? 0) + 1);
  return [...counts.entries()]
    .map(([pillar, count]) => ({ pillar, count, understocked: count < 3 }))
    .sort((a, b) => a.count - b.count || a.pillar.localeCompare(b.pillar, "pt-BR"));
}
