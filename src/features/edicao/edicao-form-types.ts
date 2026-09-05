import { EMPTY_EDIT_CHECKLIST, type EditChecklist } from "@/types/domain";

/**
 * Valores do formulário do workspace de Edição tal como o react-hook-form
 * manipula — tudo string/array simples (nunca null: a conversão para null
 * acontece só na hora de montar o payload no servidor, ver
 * src/lib/validations/editing.ts). Não é derivado de z.infer pelo mesmo
 * motivo documentado em script-form-types.ts.
 */
export interface VisualReferenceFormValue {
  label: string;
  url: string;
}

export interface EditWorkspaceFormValues {
  rawFileUrl: string;
  editedFileUrl: string;
  editorName: string;
  editInstructions: string;
  visualReferences: VisualReferenceFormValue[];
  cutsNotes: string;
  onScreenTextNotes: string;
  captionsNotes: string;
  audioNotes: string;
  coverNotes: string;
  dueAt: string;
  checklist: EditChecklist;
}

export const EMPTY_EDIT_WORKSPACE_FORM_VALUES: EditWorkspaceFormValues = {
  rawFileUrl: "",
  editedFileUrl: "",
  editorName: "",
  editInstructions: "",
  visualReferences: [],
  cutsNotes: "",
  onScreenTextNotes: "",
  captionsNotes: "",
  audioNotes: "",
  coverNotes: "",
  dueAt: "",
  checklist: { ...EMPTY_EDIT_CHECKLIST },
};
