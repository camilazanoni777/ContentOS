import type { MetricSnapshot, MetricWindow } from "@/types/domain";

/**
 * Valores do formulário de captura de métricas — todos strings (padrão do
 * projeto para formulários com React Hook Form: o tipo de formulário fica
 * separado do tipo inferido do Zod, ver AgendamentoWorkspaceFormValues).
 * Um campo vazio ("") sempre significa "não informado" e o Zod transforma
 * isso em `null`, nunca em 0 — ver validations/metric-snapshot.ts.
 */
export interface MetricSnapshotFormValues {
  windowType: MetricWindow;
  windowStart: string;
  windowEnd: string;
  capturedAt: string;
  views: string;
  reach: string;
  impressions: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  replies: string;
  profileVisits: string;
  followersGained: string;
  linkClicks: string;
  leads: string;
  sales: string;
  revenue: string;
  averageWatchTimeSeconds: string;
  videoDurationSeconds: string;
  threeSecondViews: string;
  completedViews: string;
  retentionRate: string;
  storyExits: string;
  tapsForward: string;
  tapsBack: string;
}

function numberToInput(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

/** Campos visíveis no modo "rápido" — o essencial de alcance, engajamento e conversão em seguidores. Os demais campos continuam registrados no formulário (ver MetricCaptureFormInner) e preservam seu valor mesmo escondidos. */
export const QUICK_CAPTURE_FIELDS: (keyof MetricSnapshotFormValues)[] = [
  "views",
  "reach",
  "likes",
  "comments",
  "shares",
  "saves",
  "followersGained",
  "linkClicks",
];

/** Valores iniciais para uma captura nova — tudo vazio (nunca "0"), a janela e a hora de captura vêm de fora (ver MetricCaptureDrawer). */
export function emptyMetricSnapshotFormValues(windowType: MetricWindow, capturedAtLocal: string): MetricSnapshotFormValues {
  return {
    windowType,
    windowStart: "",
    windowEnd: "",
    capturedAt: capturedAtLocal,
    views: "",
    reach: "",
    impressions: "",
    likes: "",
    comments: "",
    shares: "",
    saves: "",
    replies: "",
    profileVisits: "",
    followersGained: "",
    linkClicks: "",
    leads: "",
    sales: "",
    revenue: "",
    averageWatchTimeSeconds: "",
    videoDurationSeconds: "",
    threeSecondViews: "",
    completedViews: "",
    retentionRate: "",
    storyExits: "",
    tapsForward: "",
    tapsBack: "",
  };
}

/** Valores iniciais a partir de uma captura já existente (edição). */
export function metricSnapshotToFormValues(
  snapshot: MetricSnapshot,
  windowStartLocal: string,
  windowEndLocal: string,
  capturedAtLocal: string,
): MetricSnapshotFormValues {
  return {
    windowType: snapshot.window_type,
    windowStart: windowStartLocal,
    windowEnd: windowEndLocal,
    capturedAt: capturedAtLocal,
    views: numberToInput(snapshot.views),
    reach: numberToInput(snapshot.reach),
    impressions: numberToInput(snapshot.impressions),
    likes: numberToInput(snapshot.likes),
    comments: numberToInput(snapshot.comments),
    shares: numberToInput(snapshot.shares),
    saves: numberToInput(snapshot.saves),
    replies: numberToInput(snapshot.replies),
    profileVisits: numberToInput(snapshot.profile_visits),
    followersGained: numberToInput(snapshot.followers_gained),
    linkClicks: numberToInput(snapshot.link_clicks),
    leads: numberToInput(snapshot.leads),
    sales: numberToInput(snapshot.sales),
    revenue: numberToInput(snapshot.revenue),
    averageWatchTimeSeconds: numberToInput(snapshot.average_watch_time_seconds),
    videoDurationSeconds: numberToInput(snapshot.video_duration_seconds),
    threeSecondViews: numberToInput(snapshot.three_second_views),
    completedViews: numberToInput(snapshot.completed_views),
    retentionRate: numberToInput(snapshot.retention_rate),
    storyExits: numberToInput(snapshot.story_exits),
    tapsForward: numberToInput(snapshot.taps_forward),
    tapsBack: numberToInput(snapshot.taps_back),
  };
}
