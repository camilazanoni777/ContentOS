/**
 * Aliases amigáveis para os tipos gerados em database.ts, usados pelo
 * restante da aplicação (camada de dados, formulários, componentes).
 */
import type { ContentStatus, Database, MetricWindow } from "./database";

export type { ContentStatus, MetricWindow };

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
export type AppSettingsInsert = Database["public"]["Tables"]["app_settings"]["Insert"];
export type AppSettingsUpdate = Database["public"]["Tables"]["app_settings"]["Update"];

export type InstagramAccount = Database["public"]["Tables"]["instagram_accounts"]["Row"];
export type InstagramAccountInsert = Database["public"]["Tables"]["instagram_accounts"]["Insert"];
export type InstagramAccountUpdate = Database["public"]["Tables"]["instagram_accounts"]["Update"];

export type ContentSeries = Database["public"]["Tables"]["content_series"]["Row"];
export type ContentSeriesInsert = Database["public"]["Tables"]["content_series"]["Insert"];
export type ContentSeriesUpdate = Database["public"]["Tables"]["content_series"]["Update"];

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
export type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];
export type ContentItemInsert = Database["public"]["Tables"]["content_items"]["Insert"];
export type ContentItemUpdate = Database["public"]["Tables"]["content_items"]["Update"];

export type ContentStatusHistory = Database["public"]["Tables"]["content_status_history"]["Row"];

export type MetricSnapshot = Database["public"]["Tables"]["metric_snapshots"]["Row"];
export type MetricSnapshotInsert = Database["public"]["Tables"]["metric_snapshots"]["Insert"];
export type MetricSnapshotUpdate = Database["public"]["Tables"]["metric_snapshots"]["Update"];

export type ProfileSnapshot = Database["public"]["Tables"]["profile_snapshots"]["Row"];
export type ProfileSnapshotInsert = Database["public"]["Tables"]["profile_snapshots"]["Insert"];
export type ProfileSnapshotUpdate = Database["public"]["Tables"]["profile_snapshots"]["Update"];

export type DailyCheckin = Database["public"]["Tables"]["daily_checkins"]["Row"];
export type DailyCheckinInsert = Database["public"]["Tables"]["daily_checkins"]["Insert"];
export type DailyCheckinUpdate = Database["public"]["Tables"]["daily_checkins"]["Update"];

export type DailyAction = Database["public"]["Tables"]["daily_actions"]["Row"];
export type DailyActionInsert = Database["public"]["Tables"]["daily_actions"]["Insert"];
export type DailyActionUpdate = Database["public"]["Tables"]["daily_actions"]["Update"];

export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
export type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];

export type WeeklyReview = Database["public"]["Tables"]["weekly_reviews"]["Row"];
export type WeeklyReviewInsert = Database["public"]["Tables"]["weekly_reviews"]["Insert"];
export type WeeklyReviewUpdate = Database["public"]["Tables"]["weekly_reviews"]["Update"];

/** Ordem canônica do pipeline editorial, da ideia até o arquivamento. */
export const CONTENT_STATUS_ORDER: ContentStatus[] = [
  "idea",
  "researching",
  "scripting",
  "ready_to_record",
  "recorded",
  "editing",
  "awaiting_approval",
  "scheduled",
  "published",
  "repurpose",
  "archived",
  "canceled",
];

/** Rótulos em pt-BR para cada status do pipeline. */
export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  idea: "Ideia",
  researching: "Pesquisando",
  scripting: "Roteirizando",
  ready_to_record: "Pronto para gravar",
  recorded: "Gravado",
  editing: "Editando",
  awaiting_approval: "Aguardando aprovação",
  scheduled: "Agendado",
  published: "Publicado",
  repurpose: "Reaproveitar",
  archived: "Arquivado",
  canceled: "Cancelado",
};

/** Rótulos em pt-BR para as janelas de leitura de métricas. */
export const METRIC_WINDOW_LABELS: Record<MetricWindow, string> = {
  "24h": "24 horas",
  "7d": "7 dias",
  "30d": "30 dias",
  custom: "Período customizado",
};
