/**
 * Aliases amigáveis para os tipos gerados em database.ts, usados pelo
 * restante da aplicação (camada de dados, formulários, componentes).
 */
import type { CampaignPaymentStatus, CampaignType, ContentStatus, ContractStatus, Database, DeliverableStatus, DeliveryStatus, Json, MetricWindow, NegotiationStatus, PaymentInstallmentStatus, ProductStatus, SalesRecordSource } from "./database";

export type { CampaignPaymentStatus, CampaignType, ContentStatus, ContractStatus, DeliverableStatus, DeliveryStatus, Json, MetricWindow, NegotiationStatus, PaymentInstallmentStatus, ProductStatus, SalesRecordSource };

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

export type CampaignDeliverable = Database["public"]["Tables"]["campaign_deliverables"]["Row"];
export type CampaignDeliverableInsert = Database["public"]["Tables"]["campaign_deliverables"]["Insert"];
export type CampaignDeliverableUpdate = Database["public"]["Tables"]["campaign_deliverables"]["Update"];
export type CampaignPayment = Database["public"]["Tables"]["campaign_payments"]["Row"];
export type CampaignPaymentInsert = Database["public"]["Tables"]["campaign_payments"]["Insert"];
export type CampaignPaymentUpdate = Database["public"]["Tables"]["campaign_payments"]["Update"];
export type SalesRecord = Database["public"]["Tables"]["sales_records"]["Row"];
export type SalesRecordInsert = Database["public"]["Tables"]["sales_records"]["Insert"];
export type SalesRecordUpdate = Database["public"]["Tables"]["sales_records"]["Update"];

export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];
export type ContentItemInsert = Database["public"]["Tables"]["content_items"]["Insert"];
export type ContentItemUpdate = Database["public"]["Tables"]["content_items"]["Update"];

export type ContentStatusHistory = Database["public"]["Tables"]["content_status_history"]["Row"];

export type ContentScriptVersion = Database["public"]["Tables"]["content_script_versions"]["Row"];

export type RecordingSession = Database["public"]["Tables"]["recording_sessions"]["Row"];
export type RecordingSessionInsert = Database["public"]["Tables"]["recording_sessions"]["Insert"];
export type RecordingSessionUpdate = Database["public"]["Tables"]["recording_sessions"]["Update"];

export type RecordingSessionItem = Database["public"]["Tables"]["recording_session_items"]["Row"];
export type RecordingSessionItemInsert = Database["public"]["Tables"]["recording_session_items"]["Insert"];
export type RecordingSessionItemUpdate = Database["public"]["Tables"]["recording_session_items"]["Update"];

export type ContentReviewComment = Database["public"]["Tables"]["content_review_comments"]["Row"];
export type ContentReviewCommentInsert = Database["public"]["Tables"]["content_review_comments"]["Insert"];
export type ContentReviewCommentUpdate = Database["public"]["Tables"]["content_review_comments"]["Update"];

/** Status de um comentário/revisão de edição — pode ser reaberto (não é histórico imutável). */
export type ReviewCommentStatus = "open" | "resolved";

/** Uma referência visual da edição, item de `content_items.edit_visual_references` (jsonb). */
export interface EditVisualReference {
  label: string;
  url: string;
}

/** Chaves fixas de `content_items.recording_checklist` (jsonb) — Página Gravação. */
export const RECORDING_CHECKLIST_KEYS = [
  "script_open",
  "scenario",
  "lighting",
  "audio",
  "main_take",
  "broll",
  "cover",
  "backup",
] as const;

export type RecordingChecklistKey = (typeof RECORDING_CHECKLIST_KEYS)[number];

export type RecordingChecklist = Record<RecordingChecklistKey, boolean>;

export const RECORDING_CHECKLIST_LABELS: Record<RecordingChecklistKey, string> = {
  script_open: "Roteiro aberto",
  scenario: "Cenário pronto",
  lighting: "Iluminação",
  audio: "Áudio",
  main_take: "Take principal",
  broll: "B-roll",
  cover: "Capa",
  backup: "Backup",
};

export const EMPTY_RECORDING_CHECKLIST: RecordingChecklist = {
  script_open: false,
  scenario: false,
  lighting: false,
  audio: false,
  main_take: false,
  broll: false,
  cover: false,
  backup: false,
};

/** Chaves fixas de `content_items.edit_checklist` (jsonb) — Página Edição. */
export const EDIT_CHECKLIST_KEYS = [
  "hook_first_seconds",
  "pacing",
  "cuts",
  "audio",
  "captions",
  "safe_zones",
  "brand_identity",
  "cta",
  "spelling_review",
] as const;

export type EditChecklistKey = (typeof EDIT_CHECKLIST_KEYS)[number];

export type EditChecklist = Record<EditChecklistKey, boolean>;

export const EDIT_CHECKLIST_LABELS: Record<EditChecklistKey, string> = {
  hook_first_seconds: "Gancho nos primeiros segundos",
  pacing: "Ritmo",
  cuts: "Cortes",
  audio: "Áudio",
  captions: "Legenda",
  safe_zones: "Safe zones",
  brand_identity: "Identidade visual",
  cta: "CTA",
  spelling_review: "Revisão ortográfica",
};

export const EMPTY_EDIT_CHECKLIST: EditChecklist = {
  hook_first_seconds: false,
  pacing: false,
  cuts: false,
  audio: false,
  captions: false,
  safe_zones: false,
  brand_identity: false,
  cta: false,
  spelling_review: false,
};

/**
 * Um bloco de `content_items.script_structure` (jsonb) — a posição no array
 * é a própria ordem (sem campo `order` redundante). Rotulado como slide,
 * cena ou tela pela UI conforme o formato do conteúdo.
 */
export interface ScriptStructureBlock {
  content: string;
  note: string | null;
}

/** Um item de `content_items.shot_list` (jsonb) — idem, ordem = posição no array. */
export interface ShotListItem {
  type: "take" | "broll";
  description: string;
}

/** Snapshot salvo em `content_script_versions.snapshot` (jsonb). */
export interface ScriptSnapshot {
  hook: string | null;
  hookVariations: string[];
  script: string | null;
  scriptStructure: ScriptStructureBlock[];
  onScreenText: string | null;
  shotList: ShotListItem[];
  caption: string | null;
  estimatedDurationSeconds: number | null;
}

/** Chaves fixas de `content_items.script_checklist` (jsonb). */
export const SCRIPT_CHECKLIST_KEYS = [
  "clear_promise",
  "strong_hook",
  "delivery",
  "proof_example",
  "cta",
  "objective_coherence",
] as const;

export type ScriptChecklistKey = (typeof SCRIPT_CHECKLIST_KEYS)[number];

export type ScriptChecklist = Record<ScriptChecklistKey, boolean>;

export const SCRIPT_CHECKLIST_LABELS: Record<ScriptChecklistKey, string> = {
  clear_promise: "Promessa clara",
  strong_hook: "Gancho forte",
  delivery: "Entrega cumprida",
  proof_example: "Prova ou exemplo",
  cta: "CTA presente",
  objective_coherence: "Coerência com o objetivo",
};

export const EMPTY_SCRIPT_CHECKLIST: ScriptChecklist = {
  clear_promise: false,
  strong_hook: false,
  delivery: false,
  proof_example: false,
  cta: false,
  objective_coherence: false,
};

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

export type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];
export type ChecklistItemInsert = Database["public"]["Tables"]["checklist_items"]["Insert"];
export type ChecklistItemUpdate = Database["public"]["Tables"]["checklist_items"]["Update"];

/** Um item de `daily_checkins.priorities` (jsonb). */
export interface CheckinPriority {
  label: string;
  contentItemId?: string | null;
  goalId?: string | null;
}

export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
export type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];

export type WeeklyReview = Database["public"]["Tables"]["weekly_reviews"]["Row"];
export type WeeklyReviewInsert = Database["public"]["Tables"]["weekly_reviews"]["Insert"];
export type WeeklyReviewUpdate = Database["public"]["Tables"]["weekly_reviews"]["Update"];

export type CalendarImportantDate = Database["public"]["Tables"]["calendar_important_dates"]["Row"];
export type CalendarImportantDateInsert =
  Database["public"]["Tables"]["calendar_important_dates"]["Insert"];
export type CalendarImportantDateUpdate =
  Database["public"]["Tables"]["calendar_important_dates"]["Update"];

export type AlertDismissal = Database["public"]["Tables"]["alert_dismissals"]["Row"];
export type AlertDismissalInsert = Database["public"]["Tables"]["alert_dismissals"]["Insert"];
export type AlertDismissalUpdate = Database["public"]["Tables"]["alert_dismissals"]["Update"];

/** Chaves fixas de `content_items.scheduling_checklist` (jsonb) — Página Agendamento. */
export const SCHEDULING_CHECKLIST_KEYS = [
  "caption_final",
  "hashtags_definidas",
  "cta_presente",
  "capa_definida",
  "horario_conferido",
  "campanha_vinculada",
] as const;

export type SchedulingChecklistKey = (typeof SCHEDULING_CHECKLIST_KEYS)[number];

export type SchedulingChecklist = Record<SchedulingChecklistKey, boolean>;

export const SCHEDULING_CHECKLIST_LABELS: Record<SchedulingChecklistKey, string> = {
  caption_final: "Legenda final revisada",
  hashtags_definidas: "Palavras-chave/hashtags definidas",
  cta_presente: "CTA presente",
  capa_definida: "Capa definida",
  horario_conferido: "Horário conferido",
  campanha_vinculada: "Campanha/produto vinculado (se aplicável)",
};

export const EMPTY_SCHEDULING_CHECKLIST: SchedulingChecklist = {
  caption_final: false,
  hashtags_definidas: false,
  cta_presente: false,
  capa_definida: false,
  horario_conferido: false,
  campanha_vinculada: false,
};

/** Ordem canônica do pipeline editorial, da ideia até o arquivamento. */
export const CONTENT_STATUS_ORDER = [
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
] as const satisfies readonly ContentStatus[];

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
