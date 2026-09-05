import { EMPTY_SCHEDULING_CHECKLIST, type SchedulingChecklist } from "@/types/domain";

/**
 * Valores do formulário do workspace de Agendamento tal como o
 * react-hook-form manipula — tudo string/objeto simples (nunca null: a
 * conversão para null acontece só no servidor, ver
 * src/lib/validations/agendamento.ts). Não é derivado de z.infer pelo mesmo
 * motivo documentado em script-form-types.ts/edicao-form-types.ts.
 */
export interface SchedulingWorkspaceFormValues {
  /** Formato datetime-local (YYYY-MM-DDTHH:mm). */
  scheduledAt: string;
  caption: string;
  /** Texto livre ("#palavra outra") — convertido para array em hashtags no servidor. */
  hashtags: string;
  cta: string;
  campaignId: string;
  productId: string;
  coverNotes: string;
  checklist: SchedulingChecklist;
}

export const EMPTY_SCHEDULING_WORKSPACE_FORM_VALUES: SchedulingWorkspaceFormValues = {
  scheduledAt: "",
  caption: "",
  hashtags: "",
  cta: "",
  campaignId: "",
  productId: "",
  coverNotes: "",
  checklist: { ...EMPTY_SCHEDULING_CHECKLIST },
};
