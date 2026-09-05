"use client";

import * as React from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

import { FormDrawer } from "@/components/layout/form-drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveContentIdea,
  createContentIdea,
  deleteContentIdeaPermanently,
  restoreContentIdea,
  updateContentIdea,
} from "@/lib/actions/content-items";
import { CONTENT_FORMATS, CONTENT_OBJECTIVES, LEVEL_LABELS, LEVEL_OPTIONS, OBJECTIVE_LABELS } from "@/lib/content-pipeline";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_ORDER, type ContentItem, type ContentSeries } from "@/types/domain";

interface IdeaEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem | null;
  series: ContentSeries[];
  onSaved: (item: ContentItem) => void;
  onDeleted: (id: string) => void;
}

interface EditorState {
  title: string;
  hook: string;
  summary: string;
  pillar: string;
  format: string;
  objective: string;
  referenceText: string;
  referenceUrl: string;
  potential: string;
  productionEase: string;
  priority: string;
  status: ContentItem["status"];
  canBeSeries: boolean;
  seriesId: string;
  audienceIntent: string;
  cta: string;
  notes: string;
  tags: string;
}

function stateFromItem(item: ContentItem | null): EditorState {
  return {
    title: item?.title ?? "",
    hook: item?.hook ?? "",
    summary: item?.summary ?? "",
    pillar: item?.pillar ?? "",
    format: item?.format ?? "",
    objective: item?.objective ?? "",
    referenceText: item?.reference_text ?? "",
    referenceUrl: item?.reference_url ?? "",
    potential: item?.potential ?? "",
    productionEase: item?.production_ease ?? "",
    priority: item?.priority ?? "",
    status: item?.status ?? "idea",
    canBeSeries: item?.can_be_series ?? false,
    seriesId: item?.series_id ?? "",
    audienceIntent: item?.audience_intent ?? "",
    cta: item?.cta ?? "",
    notes: item?.notes ?? "",
    tags: item?.tags.join(", ") ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><Label>{label}</Label>{children}</div>;
}

export function IdeaEditorDrawer({ open, onOpenChange, item, series, onSaved, onDeleted }: IdeaEditorDrawerProps) {
  const [form, setForm] = React.useState<EditorState>(() => stateFromItem(item));
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");

  function set<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      seriesId: form.seriesId || null,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    const result = item ? await updateContentIdea(item.id, payload) : await createContentIdea(payload);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.item);
    onOpenChange(false);
  }

  async function handleArchive() {
    if (!item) return;
    setSaving(true);
    const result = item.archived_at ? await restoreContentIdea(item.id) : await archiveContentIdea(item.id);
    setSaving(false);
    if ("error" in result) return setError(result.error);
    onSaved(result.item);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!item) return;
    const result = await deleteContentIdeaPermanently(item.id, confirmation);
    if ("error" in result) return setError(result.error);
    setDeleteOpen(false);
    onDeleted(item.id);
    onOpenChange(false);
  }

  return (
    <>
      <FormDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={item ? "Editar ideia" : "Nova ideia"}
        description="O mesmo registro acompanha todo o pipeline — nada é duplicado entre etapas."
      >
        <form onSubmit={submit} className="flex flex-col gap-5 pb-8">
          <Field label="Título/ideia *"><Input value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus /></Field>
          <Field label="Gancho inicial"><Textarea value={form.hook} onChange={(e) => set("hook", e.target.value)} /></Field>
          <Field label="Resumo"><Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} /></Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pilar"><Input value={form.pillar} onChange={(e) => set("pillar", e.target.value)} /></Field>
            <Field label="Formato">
              <Select value={form.format} onChange={(e) => set("format", e.target.value)}>
                <option value="">Não definido</option>
                {CONTENT_FORMATS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="Objetivo">
              <Select value={form.objective} onChange={(e) => set("objective", e.target.value)}>
                <option value="">Não definido</option>
                {CONTENT_OBJECTIVES.map((value) => <option key={value} value={value}>{OBJECTIVE_LABELS[value]}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as ContentItem["status"])}>
                {CONTENT_STATUS_ORDER.map((status) => <option key={status} value={status}>{CONTENT_STATUS_LABELS[status]}</option>)}
              </Select>
            </Field>
            <Field label="Potencial">
              <Select value={form.potential} onChange={(e) => set("potential", e.target.value)}>
                <option value="">Não definido</option>
                {["alto", "medio", "baixo"].map((value) => <option key={value} value={value}>{LEVEL_LABELS[value]}</option>)}
              </Select>
            </Field>
            <Field label="Facilidade de produção">
              <Select value={form.productionEase} onChange={(e) => set("productionEase", e.target.value)}>
                <option value="">Não definida</option>
                {LEVEL_OPTIONS.map((value) => <option key={value} value={value}>{LEVEL_LABELS[value]}</option>)}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="">Não definida</option>
                {LEVEL_OPTIONS.map((value) => <option key={value} value={value}>{LEVEL_LABELS[value]}</option>)}
              </Select>
            </Field>
            <Field label="Série associada">
              <Select value={form.seriesId} onChange={(e) => set("seriesId", e.target.value)}>
                <option value="">Nenhuma</option>
                {series.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
              </Select>
            </Field>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium">
            <Checkbox checked={form.canBeSeries} onCheckedChange={(checked) => set("canBeSeries", checked)} />
            Pode virar série
          </label>

          <Field label="Público/intenção"><Textarea value={form.audienceIntent} onChange={(e) => set("audienceIntent", e.target.value)} /></Field>
          <Field label="CTA"><Input value={form.cta} onChange={(e) => set("cta", e.target.value)} /></Field>
          <Field label="Referência em texto"><Textarea value={form.referenceText} onChange={(e) => set("referenceText", e.target.value)} /></Field>
          <Field label="URL da referência"><Input type="url" placeholder="https://" value={form.referenceUrl} onChange={(e) => set("referenceUrl", e.target.value)} /></Field>
          <Field label="Observações"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
          <Field label="Tags"><Input placeholder="lançamento, bastidores, tutorial" value={form.tags} onChange={(e) => set("tags", e.target.value)} /></Field>

          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            {item ? (
              <>
                <Button type="button" variant="outline" onClick={handleArchive} disabled={saving}>
                  {item.archived_at ? <RotateCcw /> : <Archive />}
                  {item.archived_at ? "Restaurar" : "Arquivar"}
                </Button>
                <Button type="button" variant="ghost" className="ml-auto text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 /> Excluir definitivamente
                </Button>
              </>
            ) : null}
          </div>
        </form>
      </FormDrawer>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir permanentemente?</DialogTitle>
            <DialogDescription>
              Esta ação apaga a ideia e seu histórico. Para confirmar, digite EXCLUIR abaixo.
            </DialogDescription>
          </DialogHeader>
          <Input aria-label="Confirmação de exclusão" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="EXCLUIR" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={confirmation !== "EXCLUIR"} onClick={handleDelete}>Excluir para sempre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
