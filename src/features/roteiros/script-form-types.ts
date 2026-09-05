import { EMPTY_SCRIPT_CHECKLIST, type ScriptChecklist } from "@/types/domain";

/**
 * Valores do formulário do workspace de Roteiros tal como o
 * react-hook-form manipula — tudo string/array simples (nunca null: a
 * conversão para null acontece só na hora de montar o payload no servidor,
 * ver src/lib/validations/script.ts). Não é derivado de z.infer para não
 * lidar com a diferença entre tipo de entrada e saída dos `.transform()` do
 * schema (mesmo motivo documentado em checkin-form-types.ts).
 */
export interface HookVariationFormValue {
  value: string;
}

export interface ScriptStructureFormValue {
  content: string;
  note: string;
}

export interface ShotListFormValue {
  type: "take" | "broll";
  description: string;
}

export interface ScriptFormValues {
  summary: string;
  objective: string;
  pillar: string;
  audienceIntent: string;
  format: string;
  cta: string;
  referenceText: string;
  referenceUrl: string;
  hook: string;
  hookVariations: HookVariationFormValue[];
  script: string;
  scriptStructure: ScriptStructureFormValue[];
  onScreenText: string;
  shotList: ShotListFormValue[];
  caption: string;
  recordingNotes: string;
  estimatedDurationSeconds: string;
  scriptChecklist: ScriptChecklist;
}

export const EMPTY_SCRIPT_FORM_VALUES: ScriptFormValues = {
  summary: "",
  objective: "",
  pillar: "",
  audienceIntent: "",
  format: "",
  cta: "",
  referenceText: "",
  referenceUrl: "",
  hook: "",
  hookVariations: [],
  script: "",
  scriptStructure: [],
  onScreenText: "",
  shotList: [],
  caption: "",
  recordingNotes: "",
  estimatedDurationSeconds: "",
  scriptChecklist: { ...EMPTY_SCRIPT_CHECKLIST },
};
