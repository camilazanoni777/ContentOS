/**
 * Valores do formulário de Planejamento Semanal tal como o react-hook-form
 * manipula — tudo string simples (nunca null: a conversão para null
 * acontece só no servidor, ver src/lib/validations/planejamento-semanal.ts).
 */
export interface WeeklyPlanFormValues {
  strategicFocus: string;
  weeklyExperiment: string;
  priorityContentId: string;
  activeCampaignId: string;
  /** Texto livre (aceita vírgula ou ponto decimal) — convertido para número no servidor. */
  plannedHours: string;
}

export const EMPTY_WEEKLY_PLAN_FORM_VALUES: WeeklyPlanFormValues = {
  strategicFocus: "",
  weeklyExperiment: "",
  priorityContentId: "",
  activeCampaignId: "",
  plannedHours: "",
};
