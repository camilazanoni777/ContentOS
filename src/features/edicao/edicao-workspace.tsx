"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, CheckCircle2, Save } from "lucide-react";

import { SaveStatusIndicator } from "@/components/feedback/save-status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { advanceEditingStatus, saveEditingDraft } from "@/lib/actions/editing";
import { getNextEditingStatus, parseEditVisualReferences, parseEditChecklist, editChecklistProgress } from "@/lib/editing";
import { VisualReferencesFieldArray } from "@/features/edicao/visual-references-field-array";
import { EditChecklistSection } from "@/features/edicao/edit-checklist-section";
import { ReviewComments } from "@/features/edicao/review-comments";
import type { EditWorkspaceFormValues } from "@/features/edicao/edicao-form-types";
import type { ContentItem, ContentReviewComment, ContentStatus, EditChecklistKey } from "@/types/domain";
import { CONTENT_STATUS_LABELS } from "@/types/domain";

interface EdicaoWorkspaceProps {
  item: ContentItem;
  comments: ContentReviewComment[];
}

const NEXT_ACTION_LABEL: Record<ContentStatus, string> = {
  idea: "",
  researching: "",
  scripting: "",
  ready_to_record: "",
  recorded: "Iniciar edição",
  editing: "Enviar para aprovação",
  awaiting_approval: "Aprovar",
  scheduled: "",
  published: "",
  repurpose: "",
  archived: "",
  canceled: "",
};

function toDefaultValues(item: ContentItem): EditWorkspaceFormValues {
  return {
    rawFileUrl: item.raw_file_url ?? "",
    editedFileUrl: item.edited_file_url ?? "",
    editorName: item.editor_name ?? "",
    editInstructions: item.editing_notes ?? "",
    visualReferences: parseEditVisualReferences(item.edit_visual_references),
    cutsNotes: item.edit_cuts_notes ?? "",
    onScreenTextNotes: item.edit_on_screen_text_notes ?? "",
    captionsNotes: item.edit_captions_notes ?? "",
    audioNotes: item.edit_audio_notes ?? "",
    coverNotes: item.cover_notes ?? "",
    dueAt: item.production_due_at ? item.production_due_at.slice(0, 10) : "",
    checklist: parseEditChecklist(item.edit_checklist),
  };
}

export function EdicaoWorkspace({ item, comments }: EdicaoWorkspaceProps) {
  const router = useRouter();
  const { register, control, watch, setValue } = useForm<EditWorkspaceFormValues>({
    defaultValues: toDefaultValues(item),
  });

  const [currentStatus, setCurrentStatus] = React.useState<ContentStatus>(item.status);
  const [advanceStatus, setAdvanceStatus] = React.useState<"idle" | "saving" | "error">("idle");
  const [advanceError, setAdvanceError] = React.useState<string | null>(null);

  const values = watch();

  const { status, savedAt, error, retry, dirty } = useAutosave({
    value: values,
    save: (current) => saveEditingDraft(item.id, current),
  });

  useUnsavedChangesWarning(dirty);

  const checklistProgress = editChecklistProgress(values.checklist);
  const nextStatus = getNextEditingStatus(currentStatus);
  const nextLabel = NEXT_ACTION_LABEL[currentStatus];

  function handleChecklistChange(key: EditChecklistKey, checked: boolean) {
    setValue(`checklist.${key}`, checked, { shouldDirty: true });
  }

  async function handleAdvance() {
    if (!nextStatus) return;
    setAdvanceStatus("saving");
    setAdvanceError(null);
    const result = await advanceEditingStatus(item.id, currentStatus, values);
    if ("error" in result) {
      setAdvanceStatus("error");
      setAdvanceError(result.error);
      return;
    }
    setAdvanceStatus("idle");
    setCurrentStatus(result.item.status);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-16 z-10 -mx-1 flex justify-end px-1">
        <div className="rounded-full border border-border bg-card px-3 py-1 shadow-sm">
          <SaveStatusIndicator status={status} savedAt={savedAt} error={error} onRetry={retry} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arquivos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rawFileUrl">Link do arquivo bruto</Label>
            <Input id="rawFileUrl" type="url" placeholder="https://..." {...register("rawFileUrl")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editedFileUrl">Link do arquivo editado</Label>
            <Input id="editedFileUrl" type="url" placeholder="https://..." {...register("editedFileUrl")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editorName">Editor responsável</Label>
            <Input id="editorName" {...register("editorName")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueAt">Prazo</Label>
            <Input id="dueAt" type="date" {...register("dueAt")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instruções de edição</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="editInstructions" rows={4} placeholder="Como esse conteúdo deve ser editado..." {...register("editInstructions")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referências visuais</CardTitle>
        </CardHeader>
        <CardContent>
          <VisualReferencesFieldArray control={control} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas de edição</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cutsNotes">Cortes</Label>
            <Textarea id="cutsNotes" rows={3} {...register("cutsNotes")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onScreenTextNotes">Texto na tela</Label>
            <Textarea id="onScreenTextNotes" rows={3} {...register("onScreenTextNotes")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="captionsNotes">Legendas</Label>
            <Textarea id="captionsNotes" rows={3} {...register("captionsNotes")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="audioNotes">Áudio</Label>
            <Textarea id="audioNotes" rows={3} {...register("audioNotes")} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="coverNotes">Capa</Label>
            <Textarea id="coverNotes" rows={3} {...register("coverNotes")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist de qualidade</CardTitle>
        </CardHeader>
        <CardContent>
          <EditChecklistSection value={values.checklist} onChange={handleChecklistChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentários / revisões</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewComments contentItemId={item.id} initialComments={comments} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          {checklistProgress.checked < checklistProgress.total ? (
            <p className="text-xs text-muted-foreground">
              Checklist incompleto ({checklistProgress.checked}/{checklistProgress.total}) — ainda dá para avançar, se preferir.
            </p>
          ) : null}
          {advanceStatus === "error" && advanceError ? <p className="text-sm text-destructive">{advanceError}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Status atual: {CONTENT_STATUS_LABELS[currentStatus]}</span>
            {nextStatus ? (
              <Button type="button" className="gap-1.5" disabled={advanceStatus === "saving"} onClick={handleAdvance}>
                {nextStatus === "scheduled" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                {advanceStatus === "saving" ? "Salvando..." : nextLabel}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Save className="h-3.5 w-3.5" aria-hidden="true" /> Sem próxima etapa de edição a partir daqui.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
