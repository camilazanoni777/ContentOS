import type { ProfileSnapshot } from "@/types/domain";

/**
 * Valores do formulário de registro de perfil — todos strings (mesmo padrão
 * de MetricSnapshotFormValues). Campo vazio ("") sempre significa "não
 * informado" e o Zod transforma isso em `null`, nunca em 0.
 */
export interface ProfileSnapshotFormValues {
  accountId: string;
  snapshotDate: string;
  followers: string;
  following: string;
  views: string;
  reach: string;
  impressions: string;
  accountsEngaged: string;
  interactions: string;
  profileVisits: string;
  websiteClicks: string;
  messages: string;
  leads: string;
  sales: string;
  revenue: string;
  postsCount: string;
  storiesCount: string;
  hoursInvested: string;
  notes: string;
}

function numberToInput(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

/** Valores iniciais para um registro novo — tudo vazio (nunca "0"), exceto conta e data, definidos por quem abre o formulário. */
export function emptyProfileSnapshotFormValues(accountId: string, snapshotDate: string): ProfileSnapshotFormValues {
  return {
    accountId,
    snapshotDate,
    followers: "",
    following: "",
    views: "",
    reach: "",
    impressions: "",
    accountsEngaged: "",
    interactions: "",
    profileVisits: "",
    websiteClicks: "",
    messages: "",
    leads: "",
    sales: "",
    revenue: "",
    postsCount: "",
    storiesCount: "",
    hoursInvested: "",
    notes: "",
  };
}

/** Valores iniciais a partir de um registro existente (edição). */
export function profileSnapshotToFormValues(snapshot: ProfileSnapshot): ProfileSnapshotFormValues {
  return {
    accountId: snapshot.account_id,
    snapshotDate: snapshot.snapshot_date,
    followers: numberToInput(snapshot.followers),
    following: numberToInput(snapshot.following),
    views: numberToInput(snapshot.views),
    reach: numberToInput(snapshot.reach),
    impressions: numberToInput(snapshot.impressions),
    accountsEngaged: numberToInput(snapshot.accounts_engaged),
    interactions: numberToInput(snapshot.interactions),
    profileVisits: numberToInput(snapshot.profile_visits),
    websiteClicks: numberToInput(snapshot.website_clicks),
    messages: numberToInput(snapshot.messages),
    leads: numberToInput(snapshot.leads),
    sales: numberToInput(snapshot.sales),
    revenue: numberToInput(snapshot.revenue),
    postsCount: numberToInput(snapshot.posts_count),
    storiesCount: numberToInput(snapshot.stories_count),
    hoursInvested: numberToInput(snapshot.hours_invested),
    notes: snapshot.notes ?? "",
  };
}
