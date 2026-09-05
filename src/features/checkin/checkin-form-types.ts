/**
 * Valores do formulário de Check-in tal como o react-hook-form manipula —
 * tudo string (selects/inputs vazios usam "", nunca null: conversão para
 * null acontece só na hora de montar o payload enviado ao servidor). Não é
 * derivado de z.infer para não lidar com a diferença entre tipo de entrada
 * e saída dos `.transform()` do schema (ver src/lib/validations/checkin.ts).
 */
export interface CheckinPriorityFormValue {
  label: string;
  contentItemId: string;
  goalId: string;
}

export interface CheckinFormValues {
  objectiveMain: string;
  priorities: CheckinPriorityFormValue[];
  mainContentItemId: string;
  plannedStories: string;
  focusProductId: string;
  focusCampaignId: string;
  observedTrend: string;
  communityAction: string;
  notes: string;
  dailyLearning: string;
  eveningWins: string;
  eveningBlockers: string;
  tomorrowPriority: string;
}

export const EMPTY_CHECKIN_FORM_VALUES: CheckinFormValues = {
  objectiveMain: "",
  priorities: [],
  mainContentItemId: "",
  plannedStories: "",
  focusProductId: "",
  focusCampaignId: "",
  observedTrend: "",
  communityAction: "",
  notes: "",
  dailyLearning: "",
  eveningWins: "",
  eveningBlockers: "",
  tomorrowPriority: "",
};
