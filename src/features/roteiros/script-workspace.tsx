"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Clapperboard, Rewind, Save } from "lucide-react";

import { SaveStatusIndicator } from "@/components/feedback/save-status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { saveScriptDraft, saveScriptVersionNow, moveScriptStatus } from "@/lib/actions/script";
import { CONTENT_FORMATS, CONTENT_OBJECTIVES, OBJECTIVE_LABELS } from "@/lib/content-pipeline";
import {
  formatDuration,
  getPreviousContentStatus,
  parseHookVariations,
  parseScriptChecklist,
  parseScriptStructure,
  parseShotList,
  scriptChecklistProgress,
} from "@/lib/script-workspace";
import { HookVariationsFieldArray } from "@/features/roteiros/hook-variations-field-array";
import { ScriptStructureFieldArray } from "@/features/roteiros/script-structure-field-array";
import { ShotListFieldArray } from "@/features/roteiros/shot-list-field-array";
import { ScriptChecklistSection } from "@/features/roteiros/script-checklist-section";
import { VersionHistory } from "@/features/roteiros/version-history";
import type { ScriptFormValues } from "@/features/roteiros/script-form-types";
import type { ContentItem, ContentScriptVersion, ContentStatus, ScriptChecklistKey, ScriptSnapshot } from "@/types/domain";
import { CONTENT_STATUS_LABELS } from "@/types/domain";

interface ScriptWorkspaceProps {
  item: ContentItem;
  versions: ContentScriptVersion[];
}

function toDefaultValues(item: ContentItem): ScriptFormValues {
  return {
    summary: item.summary ?? "",
    objective: item.objective ?? "",
    pillar: item.pillar ?? "",
    audienceIntent: item.audience_intent ?? "",
    format: item.format ?? "",
    cta: item.cta ?? "",
    referenceText: item.reference_text ?? "",
    referenceUrl: item.reference_url ?? "",
    hook: item.hook ?? "",
    hookVariations: parseHookVariations(item.hook_variations).map((value) => ({ value })),
    script: item.script ?? "",
    scriptStructure: parseScriptStructure(item.script_structure).map((block) => ({
      content: block.content,
      note: block.note ?? "",
    })),
    onScreenText: item.on_screen_text ?? "",
    shotList: parseShotList(item.shot_list),
    caption: item.caption ?? "",
    recordingNotes: item.recording_notes ?? "",
    estimatedDurationSeconds: item.estimated_duration_seconds !== null ? String(item.estimated_duration_seconds) : "",
    scriptChecklist: parseScriptChecklist(item.script_checklist),
  };
}

function toActionPayload(values: ScriptFormValues) {
  return {
    ...values,
    hookVariations: values.hookVariations.map((variation) => variation.value),
  };
}

export function ScriptWorkspace({ item, versions }: ScriptWorkspaceProps) {
  const router = useRouter();
  const { register, control, watch, setValue, reset } = useForm<ScriptFormValues>({
    defaultValues: toDefaultValues(item),
  });

  const [currentStatus, setCurrentStatus] = React.useState<ContentStatus>(item.status);
  const [statusActionStatus, setStatusActionStatus] = React.useState<"idle" | "saving" | "error">("idle");
  const [statusActionError, setStatusActionError] = React.useState<string | null>(null);
  const [explicitSaveStatus, setExplicitSaveStatus] = React.useState<"idle" | "saving" | "error">("idle");
  const [explicitSaveError, setExplicitSaveError] = React.useState<string | null>(null);

  const values = watch();

  const { status, savedAt, error, retry, dirty } = useAutosave({
    value: values,
    save: (current) => saveScriptDraft(item.id, toActionPayload(current)),
  });

  useUnsavedChangesWarning(dirty);

  const checklistProgress = scriptChecklistProgress(values.scriptChecklist);
  const previousStatus = getPreviousContentStatus(currentStatus);

  async function handleSaveDraft() {
    setExplicitSaveStatus("saving");
    setExplicitSaveError(null);
    const result = await saveScriptVersionNow(item.id, toActionPayload(values));
    if ("error" in result) {
      setExplicitSaveStatus("error");
      setExplicitSaveError(result.error);
      return;
    }
    setExplicitSaveStatus("idle");
    router.refresh();
  }

  async function handleMoveStatus(nextStatus: ContentStatus) {
    setStatusActionStatus("saving");
    setStatusActionError(null);
    // Garante que o valor mais recente da tela seja persistido antes de
    // mudar de etapa, mesmo que o debounce do autosave ainda não tenha
    // disparado.
    const saveResult = await saveScriptDraft(item.id, toActionPayload(values));
    if ("error" in saveResult) {
      setStatusActionStatus("error");
      setStatusActionError(saveResult.error);
      return;
    }
    const result = await moveScriptStatus(item.id, nextStatus);
    if ("error" in result) {
      setStatusActionStatus("error");
      setStatusActionError(result.error);
      return;
    }
    setStatusActionStatus("idle");
    setCurrentStatus(nextStatus);
    router.refresh();
  }

  function handleRestore(snapshot: ScriptSnapshot) {
    reset({
      ...values,
      hook: snapshot.hook ?? "",
      hookVariations: snapshot.hookVariations.map((value) => ({ value })),
      script: snapshot.script ?? "",
      scriptStructure: snapshot.scriptStructure.map((block) => ({ content: block.content, note: block.note ?? "" })),
      onScreenText: snapshot.onScreenText ?? "",
      shotList: snapshot.shotList,
      caption: snapshot.caption ?? "",
      estimatedDurationSeconds:
        snapshot.estimatedDurationSeconds !== null ? String(snapshot.estimatedDurationSeconds) : "",
    });
  }

  function handleChecklistChange(key: ScriptChecklistKey, checked: boolean) {
    setValue(`scriptChecklist.${key}`, checked, { shouldDirty: true });
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
      <div className="sticky top-16 z-10 -mx-1 flex justify-end px-1">
        <div className="rounded-full border border-border bg-card px-3 py-1 shadow-sm">
          <SaveStatusIndicator status={status} savedAt={savedAt} error={error} onRetry={retry} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Briefing do conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="summary">Resumo</Label>
            <Textarea id="summary" rows={3} {...register("summary")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="objective">Objetivo</Label>
              <Select id="objective" {...register("objective")}>
                <option value="">Não definido</option>
                {CONTENT_OBJECTIVES.map((objective) => (
                  <option key={objective} value={objective}>
                    {OBJECTIVE_LABELS[objective]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="format">Formato</Label>
              <Select id="format" {...register("format")}>
                <option value="">Não definido</option>
                {CONTENT_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pillar">Pilar</Label>
              <Input id="pillar" {...register("pillar")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cta">CTA</Label>
              <Input id="cta" {...register("cta")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="audienceIntent">Público / intenção</Label>
            <Textarea id="audienceIntent" rows={2} {...register("audienceIntent")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referenceText">Referência original (texto)</Label>
              <Textarea id="referenceText" rows={2} {...register("referenceText")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referenceUrl">Referência original (link)</Label>
              <Input id="referenceUrl" type="url" placeholder="https://..." {...register("referenceUrl")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ganchos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hook">Gancho escolhido</Label>
            <Textarea id="hook" rows={2} placeholder="O gancho final, o que abre o conteúdo" {...register("hook")} />
          </div>
          <HookVariationsFieldArray control={control} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roteiro completo</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="script" rows={10} placeholder="Escreva o roteiro completo, fala por fala..." {...register("script")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estrutura</CardTitle>
        </CardHeader>
        <CardContent>
          <ScriptStructureFieldArray control={control} format={values.format} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Texto na tela</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="onScreenText" rows={3} placeholder="Legendas embutidas, texto de apoio..." {...register("onScreenText")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Takes e B-roll</CardTitle>
        </CardHeader>
        <CardContent>
          <ShotListFieldArray control={control} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legenda em rascunho</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="caption" rows={4} {...register("caption")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas de gravação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Textarea id="recordingNotes" rows={3} {...register("recordingNotes")} />
          <div className="flex flex-col gap-1.5 sm:w-56">
            <Label htmlFor="estimatedDurationSeconds">Duração estimada (segundos)</Label>
            <Input id="estimatedDurationSeconds" inputMode="numeric" placeholder="Ex.: 90" {...register("estimatedDurationSeconds")} />
            {values.estimatedDurationSeconds ? (
              <p className="text-xs text-muted-foreground">≈ {formatDuration(Number(values.estimatedDurationSeconds))} min</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist de roteiro</CardTitle>
        </CardHeader>
        <CardContent>
          <ScriptChecklistSection value={values.scriptChecklist} onChange={handleChecklistChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de versões</CardTitle>
        </CardHeader>
        <CardContent>
          <VersionHistory versions={versions} onRestore={handleRestore} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          {checklistProgress.checked < checklistProgress.total ? (
            <p className="text-xs text-muted-foreground">
              Checklist incompleto ({checklistProgress.checked}/{checklistProgress.total}) — ainda dá para marcar como pronto para gravar, se preferir.
            </p>
          ) : null}
          {statusActionStatus === "error" && statusActionError ? <p className="text-sm text-destructive">{statusActionError}</p> : null}
          {explicitSaveStatus === "error" && explicitSaveError ? <p className="text-sm text-destructive">{explicitSaveError}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              disabled={!previousStatus || statusActionStatus === "saving"}
              onClick={() => previousStatus && handleMoveStatus(previousStatus)}
            >
              <Rewind className="h-3.5 w-3.5" aria-hidden="true" />
              {previousStatus ? `Voltar para ${CONTENT_STATUS_LABELS[previousStatus]}` : "Voltar etapa"}
            </Button>
            <Button type="button" variant="outline" className="gap-1.5" disabled={explicitSaveStatus === "saving"} onClick={handleSaveDraft}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {explicitSaveStatus === "saving" ? "Salvando..." : "Salvar rascunho"}
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              disabled={currentStatus === "ready_to_record" || statusActionStatus === "saving"}
              onClick={() => handleMoveStatus("ready_to_record")}
            >
              {currentStatus === "ready_to_record" ? "Já está pronto para gravar" : "Marcar como pronto para gravar"}
            </Button>
            <Button asChild variant="secondary" className="gap-1.5">
              <Link href={`/roteiros/${item.id}/teleprompter`}>
                <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
                Abrir modo teleprompter
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
