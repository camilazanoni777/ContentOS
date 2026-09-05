import type { ContentItem, ContentStatus, MetricSnapshot, MetricWindow } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/dates";

/**
 * Lógica pura da página Publicados: pendências de captura de métricas
 * (24h/7d/30d após publicar), filtros/busca e a comparação entre um
 * conteúdo original e sua versão reaproveitada. Nada aqui toca o Supabase.
 */

export const PUBLICADOS_STATUSES: ContentStatus[] = ["published", "repurpose"];

const WINDOW_HOURS: Record<Extract<MetricWindow, "24h" | "7d" | "30d">, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

export interface CapturePendency {
  window: "24h" | "7d" | "30d";
  /** true quando a janela já venceu (tempo suficiente desde a publicação) mas ainda não há leitura registrada. */
  due: boolean;
  /** Horas até a janela vencer (negativo = já venceu). */
  hoursUntilDue: number;
}

/**
 * Para um conteúdo publicado, calcula quais das três janelas fixas (24h,
 * 7d, 30d) já deveriam ter uma leitura de métricas e ainda não têm —
 * comparando `published_at` + a duração da janela contra `now`, e
 * conferindo se existe um metric_snapshot daquele window_type para o
 * conteúdo (metric_snapshots tem no máximo 1 registro por
 * conteúdo+janela fixa, via upsert onConflict — ver recordMetricSnapshot).
 */
export function getCapturePendencies(
  item: Pick<ContentItem, "id" | "published_at">,
  snapshots: MetricSnapshot[],
  now = new Date(),
): CapturePendency[] {
  if (!item.published_at) return [];
  const publishedAt = new Date(item.published_at).getTime();
  const capturedWindows = new Set(
    snapshots.filter((snapshot) => snapshot.content_item_id === item.id).map((snapshot) => snapshot.window_type),
  );

  return (Object.keys(WINDOW_HOURS) as Array<keyof typeof WINDOW_HOURS>).map((window) => {
    const dueAt = publishedAt + WINDOW_HOURS[window] * 60 * 60 * 1000;
    const hoursUntilDue = (dueAt - now.getTime()) / (60 * 60 * 1000);
    return {
      window,
      due: hoursUntilDue <= 0 && !capturedWindows.has(window),
      hoursUntilDue,
    };
  });
}

export function hasAnyCapturePendency(
  item: Pick<ContentItem, "id" | "published_at">,
  snapshots: MetricSnapshot[],
  now = new Date(),
): boolean {
  return getCapturePendencies(item, snapshots, now).some((pendency) => pendency.due);
}

/** URL do post pode ser adicionada depois de publicar — mas fica como alerta visível até lá. */
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

export interface PublicadosFilters {
  search: string;
  format: string;
  pillar: string;
  pendingCapture: boolean;
  missingUrl: boolean;
}

export const EMPTY_PUBLICADOS_FILTERS: PublicadosFilters = {
  search: "",
  format: "",
  pillar: "",
  pendingCapture: false,
  missingUrl: false,
};

export function filterPublicadosItems(
  items: ContentItem[],
  filters: PublicadosFilters,
  snapshotsByItem: Map<string, MetricSnapshot[]>,
  now = new Date(),
): ContentItem[] {
  const needle = normalized(filters.search);
  return items.filter((item) => {
    if (filters.format && normalized(item.format) !== normalized(filters.format)) return false;
    if (filters.pillar && item.pillar !== filters.pillar) return false;
    if (filters.missingUrl && !isMissingPublishedUrl(item)) return false;
    if (filters.pendingCapture && !hasAnyCapturePendency(item, snapshotsByItem.get(item.id) ?? [], now)) return false;
    if (needle) {
      const haystack = normalized([item.title, item.hook, item.pillar, item.published_url].filter(Boolean).join(" "));
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function sortPublicadosItems(items: ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => {
    if (!a.published_at && !b.published_at) return 0;
    if (!a.published_at) return 1;
    if (!b.published_at) return -1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
}

export interface RepurposeComparisonField {
  key: string;
  label: string;
  original: string | null;
  repurposed: string | null;
  changed: boolean;
}

/**
 * Compara um conteúdo original com sua versão reaproveitada (que carrega
 * source_content_id apontando de volta para o original) — usada na tela de
 * comparação. Função pura: recebe os dois content_items já carregados.
 */
export function buildRepurposeComparison(
  original: ContentItem,
  repurposed: ContentItem,
): RepurposeComparisonField[] {
  const fields: { key: string; label: string; pick: (item: ContentItem) => string | null }[] = [
    { key: "title", label: "Título", pick: (item) => item.title },
    { key: "hook", label: "Gancho", pick: (item) => item.hook },
    { key: "caption", label: "Legenda", pick: (item) => item.caption },
    { key: "format", label: "Formato", pick: (item) => item.format },
    { key: "pillar", label: "Pilar", pick: (item) => item.pillar },
    { key: "cta", label: "CTA", pick: (item) => item.cta },
    {
      key: "published_at",
      label: "Data de publicação",
      pick: (item) => (item.published_at ? formatDateTimeBR(item.published_at) : null),
    },
    { key: "published_url", label: "URL do post", pick: (item) => item.published_url },
  ];

  return fields.map(({ key, label, pick }) => {
    const originalValue = pick(original);
    const repurposedValue = pick(repurposed);
    return {
      key,
      label,
      original: originalValue,
      repurposed: repurposedValue,
      changed: normalized(originalValue) !== normalized(repurposedValue),
    };
  });
}
