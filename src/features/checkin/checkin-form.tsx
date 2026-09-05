"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { MoonStar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/hooks/use-autosave";
import { saveCheckinDraft, saveNightClosing } from "@/lib/actions/checkin";
import { SaveStatusIndicator } from "@/components/feedback/save-status-indicator";
import { PrioritiesFieldArray } from "@/features/checkin/priorities-field-array";
import { parseCheckinPriorities } from "@/lib/checkin";
import type { Campaign, ContentItem, DailyCheckin, Goal, Product } from "@/types/domain";
import { EMPTY_CHECKIN_FORM_VALUES, type CheckinFormValues } from "@/features/checkin/checkin-form-types";

interface CheckinFormProps {
  initialCheckin: DailyCheckin | null;
  contentItems: ContentItem[];
  products: Product[];
  campaigns: Campaign[];
  goals: Goal[];
}

function toDefaultValues(checkin: DailyCheckin | null): CheckinFormValues {
  if (!checkin) return EMPTY_CHECKIN_FORM_VALUES;
  return {
    objectiveMain: checkin.objective_main ?? "",
    priorities: parseCheckinPriorities(checkin.priorities).map((priority) => ({
      label: priority.label,
      contentItemId: priority.contentItemId ?? "",
      goalId: priority.goalId ?? "",
    })),
    mainContentItemId: checkin.main_content_item_id ?? "",
    plannedStories: checkin.planned_stories ?? "",
    focusProductId: checkin.focus_product_id ?? "",
    focusCampaignId: checkin.focus_campaign_id ?? "",
    observedTrend: checkin.observed_trend ?? "",
    communityAction: checkin.community_action ?? "",
    notes: checkin.notes ?? "",
    dailyLearning: checkin.daily_learning ?? "",
    eveningWins: checkin.evening_wins ?? "",
    eveningBlockers: checkin.evening_blockers ?? "",
    tomorrowPriority: checkin.tomorrow_priority ?? "",
  };
}

export function CheckinForm({ initialCheckin, contentItems, products, campaigns, goals }: CheckinFormProps) {
  const { register, control, watch } = useForm<CheckinFormValues>({
    defaultValues: toDefaultValues(initialCheckin),
  });

  const [nightClosedAt, setNightClosedAt] = React.useState<string | null>(initialCheckin?.night_closed_at ?? null);
  const [closingStatus, setClosingStatus] = React.useState<"idle" | "saving" | "error">("idle");
  const [closingError, setClosingError] = React.useState<string | null>(null);

  const values = watch();

  const { status, savedAt, error, retry } = useAutosave({
    value: values,
    save: (current) => saveCheckinDraft(current),
  });

  async function handleCloseNight() {
    setClosingStatus("saving");
    setClosingError(null);
    const result = await saveNightClosing(values);
    if ("error" in result) {
      setClosingStatus("error");
      setClosingError(result.error);
      return;
    }
    setClosingStatus("idle");
    setNightClosedAt(result.checkin.night_closed_at);
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
          <CardTitle className="text-base">Check-in do dia</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objectiveMain">Objetivo principal de hoje</Label>
            <Input id="objectiveMain" placeholder="Ex.: Gravar e publicar o reel da coleção nova" {...register("objectiveMain")} />
          </div>

          <PrioritiesFieldArray control={control} contentItems={contentItems} goals={goals} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mainContentItemId">Conteúdo principal a publicar</Label>
              <Select id="mainContentItemId" {...register("mainContentItemId")}>
                <option value="">Nenhum selecionado</option>
                {contentItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plannedStories">Stories planejados</Label>
              <Input id="plannedStories" placeholder="Ex.: 3 stories sobre bastidores" {...register("plannedStories")} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="focusProductId">Produto em foco</Label>
              <Select id="focusProductId" {...register("focusProductId")}>
                <option value="">Nenhum</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="focusCampaignId">Campanha em foco</Label>
              <Select id="focusCampaignId" {...register("focusCampaignId")}>
                <option value="">Nenhuma</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observedTrend">Ideia ou tendência observada</Label>
            <Textarea id="observedTrend" rows={2} {...register("observedTrend")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="communityAction">Ação de comunidade</Label>
            <Input id="communityAction" placeholder="Ex.: Responder os 10 últimos comentários" {...register("communityAction")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dailyLearning">Aprendizado do dia</Label>
            <Textarea id="dailyLearning" rows={2} {...register("dailyLearning")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MoonStar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Fechamento noturno</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eveningWins">Principal vitória do dia</Label>
              <Input id="eveningWins" {...register("eveningWins")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eveningBlockers">Principal bloqueio</Label>
              <Input id="eveningBlockers" {...register("eveningBlockers")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tomorrowPriority">Primeira prioridade de amanhã</Label>
            <Input id="tomorrowPriority" {...register("tomorrowPriority")} />
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {nightClosedAt
                ? `Fechamento concluído às ${new Date(nightClosedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`
                : "O aprendizado do dia acima também vale para o fechamento — não precisa repetir."}
            </p>
            <Button type="button" onClick={handleCloseNight} disabled={closingStatus === "saving"} className="gap-1.5 self-start sm:self-auto">
              <MoonStar className="h-3.5 w-3.5" aria-hidden="true" />
              {closingStatus === "saving" ? "Concluindo..." : nightClosedAt ? "Atualizar fechamento" : "Concluir o dia"}
            </Button>
          </div>
          {closingStatus === "error" && closingError ? <p className="text-sm text-destructive">{closingError}</p> : null}
        </CardContent>
      </Card>
    </form>
  );
}
