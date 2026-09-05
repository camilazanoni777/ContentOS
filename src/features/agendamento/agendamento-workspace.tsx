"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";

import { SaveStatusIndicator } from "@/components/feedback/save-status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { saveSchedulingDraft } from "@/lib/actions/agendamento";
import { formatHashtagsForInput, isMissingPublishedUrl, parseSchedulingChecklist } from "@/lib/agendamento";
import { formatDateTimeBR, toDateTimeLocalInput } from "@/lib/dates";
import { SchedulingChecklistSection } from "@/features/agendamento/scheduling-checklist-section";
import { MarkAsPublishedDialog } from "@/features/agendamento/mark-as-published-dialog";
import type { SchedulingWorkspaceFormValues } from "@/features/agendamento/agendamento-form-types";
import type { Campaign, ContentItem, ContentStatus, Product, SchedulingChecklistKey } from "@/types/domain";

interface AgendamentoWorkspaceProps {
  item: ContentItem;
  campaigns: Campaign[];
  products: Product[];
}

function toDefaultValues(item: ContentItem): SchedulingWorkspaceFormValues {
  return {
    scheduledAt: toDateTimeLocalInput(item.scheduled_at),
    caption: item.caption ?? "",
    hashtags: formatHashtagsForInput(item.hashtags),
    cta: item.cta ?? "",
    campaignId: item.campaign_id ?? "",
    productId: item.product_id ?? "",
    coverNotes: item.cover_notes ?? "",
    checklist: parseSchedulingChecklist(item.scheduling_checklist),
  };
}

export function AgendamentoWorkspace({ item, campaigns, products }: AgendamentoWorkspaceProps) {
  const router = useRouter();
  const { register, watch, setValue } = useForm<SchedulingWorkspaceFormValues>({
    defaultValues: toDefaultValues(item),
  });

  const [currentItem, setCurrentItem] = React.useState<ContentItem>(item);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);

  const values = watch();

  const { status, savedAt, error, retry, dirty } = useAutosave({
    value: values,
    save: (current) => saveSchedulingDraft(item.id, current),
  });

  useUnsavedChangesWarning(dirty);

  function handleChecklistChange(key: SchedulingChecklistKey, checked: boolean) {
    setValue(`checklist.${key}`, checked, { shouldDirty: true });
  }

  const currentStatus: ContentStatus = currentItem.status;
  const alreadyPublished = currentStatus === "published";
  const missingUrl = isMissingPublishedUrl(currentItem);

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-16 z-10 -mx-1 flex justify-end px-1">
        <div className="rounded-full border border-border bg-card px-3 py-1 shadow-sm">
          <SaveStatusIndicator status={status} savedAt={savedAt} error={error} onRetry={retry} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scheduledAt">Data e hora planejadas</Label>
            <Input id="scheduledAt" type="datetime-local" disabled={alreadyPublished} {...register("scheduledAt")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cta">CTA</Label>
            <Input id="cta" disabled={alreadyPublished} {...register("cta")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaignId">Campanha</Label>
            <Select id="campaignId" disabled={alreadyPublished} {...register("campaignId")}>
              <option value="">Nenhuma</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="productId">Produto</Label>
            <Select id="productId" disabled={alreadyPublished} {...register("productId")}>
              <option value="">Nenhum</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legenda final</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="caption" rows={5} disabled={alreadyPublished} placeholder="Legenda pronta para publicar..." {...register("caption")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Palavras-chave / hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <Input id="hashtags" disabled={alreadyPublished} placeholder="#exemplo #outraTag" {...register("hashtags")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capa</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="coverNotes" rows={3} disabled={alreadyPublished} placeholder="Descrição/link da imagem de capa escolhida..." {...register("coverNotes")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist final</CardTitle>
        </CardHeader>
        <CardContent>
          <SchedulingChecklistSection value={values.checklist} onChange={handleChecklistChange} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          {missingUrl ? (
            <p className="text-sm text-tone-warning-fg">
              Publicado sem URL do post — adicione o link assim que possível.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {alreadyPublished ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-tone-success-fg">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Publicado
                {currentItem.published_at ? ` em ${formatDateTimeBR(currentItem.published_at)}` : ""}
              </span>
            ) : (
              <Button type="button" className="gap-1.5" onClick={() => setPublishDialogOpen(true)}>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Marcar como publicado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <MarkAsPublishedDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        item={currentItem}
        onPublished={(published) => {
          setCurrentItem(published);
          router.refresh();
        }}
      />
    </div>
  );
}
