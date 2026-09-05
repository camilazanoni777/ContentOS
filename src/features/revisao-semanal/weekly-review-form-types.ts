/**
 * Valores do formulário de campos manuais da Revisão Semanal, tal como o
 * react-hook-form manipula — tudo string simples (a conversão para null
 * acontece só no servidor, ver validations/revisao-semanal.ts). Mesmo
 * padrão de weekly-plan-form-types.ts (Planejamento Semanal).
 */
export interface WeeklyReviewFormValues {
  whatWorked: string;
  whatDidntWork: string;
  whatToRepeat: string;
  whatToStop: string;
  whatToTest: string;
  keyLearning: string;
  decision: string;
}

export const EMPTY_WEEKLY_REVIEW_FORM_VALUES: WeeklyReviewFormValues = {
  whatWorked: "",
  whatDidntWork: "",
  whatToRepeat: "",
  whatToStop: "",
  whatToTest: "",
  keyLearning: "",
  decision: "",
};
