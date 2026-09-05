"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  MoonStar,
  SunMedium,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

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

export function CheckinForm({
  initialCheckin,
  contentItems,
  products,
  campaigns,
  goals,
}: CheckinFormProps) {
  const { register, control, watch } = useForm<CheckinFormValues>({
    defaultValues: toDefaultValues(initialCheckin),
  });

  const [modo, setModo] = React.useState<"planejamento" | "encerramento">("planejamento");
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [nightClosedAt, setNightClosedAt] = React.useState<string | null>(
    initialCheckin?.night_closed_at ?? null,
  );
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
      {/* Top Bar: Seletor de Modo (Tabs Manhã / Noite) + Indicador de Salvamento */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Seletor de Momentos */}
        <div className="grid grid-cols-2 rounded-xl bg-muted/80 p-1 text-sm font-medium border border-border/60 max-w-md">
          <button
            type="button"
            role="tab"
            aria-selected={modo === "planejamento"}
            onClick={() => setModo("planejamento")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-4 transition-all duration-150 cursor-pointer ${
              modo === "planejamento"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SunMedium className="h-4 w-4 text-primary" />
            <span>Planejamento (Manhã)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === "encerramento"}
            onClick={() => setModo("encerramento")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 px-4 transition-all duration-150 cursor-pointer ${
              modo === "encerramento"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MoonStar className="h-4 w-4 text-primary" />
            <span>Encerramento (Noite)</span>
          </button>
        </div>

        {/* Indicador de Salvamento em Tempo Real */}
        <div className="flex items-center self-end sm:self-center">
          <div className="rounded-full border border-border bg-card px-3.5 py-1.5 shadow-2xs">
            <SaveStatusIndicator status={status} savedAt={savedAt} error={error} onRetry={retry} />
          </div>
        </div>
      </div>

      {/* Grid Principal (Layout responsivo com Desktop Summary Rail) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coluna Principal do Formulário (8 colunas no desktop) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* MODO 1: PLANEJAMENTO (MANHÃ) */}
          <div className={modo === "planejamento" ? "flex flex-col gap-6" : "hidden"}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2.5 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                  <SunMedium className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="font-sans text-base font-bold tracking-tight text-foreground">
                    Planejamento e Foco da Manhã
                  </CardTitle>
                  <p className="text-2xs text-muted-foreground">
                    Defina o objetivo do dia e estruture sua energia criativa
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-5">
                {/* Objetivo Principal de Hoje */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="objectiveMain" className="text-xs font-medium text-foreground">
                    Objetivo principal de hoje
                  </Label>
                  <Input
                    id="objectiveMain"
                    placeholder="Ex.: Gravar o Reel principal e revisar pauta da semana"
                    className="h-10 bg-card border-input"
                    {...register("objectiveMain")}
                  />
                  <p className="text-2xs text-muted-foreground">
                    O que precisa acontecer hoje para o dia ser considerado um sucesso?
                  </p>
                </div>

                {/* Prioridades (até 3) */}
                <PrioritiesFieldArray control={control} contentItems={contentItems} goals={goals} />

                {/* Pauta do Dia: Conteúdo + Stories + Comunidade */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="mainContentItemId" className="text-xs font-medium text-foreground">
                      Conteúdo principal a publicar
                    </Label>
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
                    <Label htmlFor="plannedStories" className="text-xs font-medium text-foreground">
                      Stories planejados
                    </Label>
                    <Input
                      id="plannedStories"
                      placeholder="Ex.: Sequência de 3 stories com enquete"
                      className="h-10 bg-card border-input"
                      {...register("plannedStories")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="communityAction" className="text-xs font-medium text-foreground">
                    Ação de comunidade
                  </Label>
                  <Input
                    id="communityAction"
                    placeholder="Ex.: Responder os 10 últimos comentários e interagir com 3 seguidoras"
                    className="h-10 bg-card border-input"
                    {...register("communityAction")}
                  />
                </div>

                {/* Seção Colapsável de Campos Estratégicos Adicionais */}
                <div className="border-t border-border/70 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="flex w-full items-center justify-between py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Campos estratégicos adicionais (produto, campanha, tendência, notas)</span>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {showAdvanced ? (
                    <div className="flex flex-col gap-4 pt-3 animate-in fade-in-50">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="focusProductId" className="text-xs font-medium text-foreground">
                            Produto em foco
                          </Label>
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
                          <Label htmlFor="focusCampaignId" className="text-xs font-medium text-foreground">
                            Campanha em foco
                          </Label>
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
                        <Label htmlFor="observedTrend" className="text-xs font-medium text-foreground">
                          Ideia ou tendência observada
                        </Label>
                        <Textarea
                          id="observedTrend"
                          rows={2}
                          placeholder="Ex.: Áudio em alta com transição rápida sobre rotina..."
                          {...register("observedTrend")}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="notes" className="text-xs font-medium text-foreground">
                          Observações e anotações livres
                        </Label>
                        <Textarea
                          id="notes"
                          rows={3}
                          placeholder="Ideias soltas, lembretes de equipe ou insights..."
                          {...register("notes")}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MODO 2: ENCERRAMENTO DO DIA (NOITE) */}
          <div className={modo === "encerramento" ? "flex flex-col gap-6" : "hidden"}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2.5 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tone-success-bg text-tone-success-fg">
                  <MoonStar className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="font-sans text-base font-bold tracking-tight text-foreground">
                    Fechamento Noturno e Aprendizados
                  </CardTitle>
                  <p className="text-2xs text-muted-foreground">
                    Celebre o que deu certo, registre o aprendizado e prepare o amanhã
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-5">
                {/* Vitória e Bloqueio */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="eveningWins" className="text-xs font-medium text-foreground">
                      Principal vitória do dia
                    </Label>
                    <Input
                      id="eveningWins"
                      placeholder="Ex.: Roteiro aprovado e Reel gravado no prazo"
                      className="h-10 bg-card border-input"
                      {...register("eveningWins")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="eveningBlockers" className="text-xs font-medium text-foreground">
                      Principal bloqueio
                    </Label>
                    <Input
                      id="eveningBlockers"
                      placeholder="Ex.: Demorei para acertar a iluminação"
                      className="h-10 bg-card border-input"
                      {...register("eveningBlockers")}
                    />
                  </div>
                </div>

                {/* Aprendizado do Dia */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dailyLearning" className="text-xs font-medium text-foreground">
                    Aprendizado do dia
                  </Label>
                  <Textarea
                    id="dailyLearning"
                    rows={2}
                    placeholder="Ex.: Testar os ganchos nos primeiros 2 segundos trouxe mais fluidez"
                    {...register("dailyLearning")}
                  />
                </div>

                {/* Primeira Prioridade de Amanhã */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tomorrowPriority" className="text-xs font-medium text-foreground">
                    Primeira prioridade de amanhã
                  </Label>
                  <Input
                    id="tomorrowPriority"
                    placeholder="Ex.: Começar o dia gravando os 3 stories de oferta"
                    className="h-10 bg-card border-input"
                    {...register("tomorrowPriority")}
                  />
                  <p className="text-2xs text-muted-foreground">
                    Já deixa o início do próximo dia definido para evitar procrastinação matinal.
                  </p>
                </div>

                {/* Bloco de Ação de Fechamento */}
                <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      {nightClosedAt
                        ? `Fechamento concluído às ${new Date(nightClosedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`
                        : "Pronta para encerrar o expediente?"}
                    </p>
                    <p className="text-2xs text-muted-foreground">
                      {nightClosedAt
                        ? "Suas respostas estão salvas. Você pode atualizar o fechamento a qualquer momento."
                        : "Ao concluir o dia, o painel Hoje registrará o check-in como 100% finalizado."}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleCloseNight}
                    disabled={closingStatus === "saving"}
                    className="gap-1.5 shrink-0 self-start sm:self-auto shadow-sm"
                  >
                    <MoonStar className="h-3.5 w-3.5" aria-hidden="true" />
                    {closingStatus === "saving"
                      ? "Concluindo..."
                      : nightClosedAt
                        ? "Atualizar fechamento"
                        : "Concluir o dia"}
                  </Button>
                </div>

                {closingStatus === "error" && closingError ? (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{closingError}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Desktop Summary Rail (4 colunas no desktop, fixo/sticky) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-20 flex flex-col gap-4">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resumo do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Foco de hoje */}
                <div className="space-y-1">
                  <span className="font-semibold text-foreground block">Foco de hoje:</span>
                  <p className="text-muted-foreground italic line-clamp-2">
                    {values.objectiveMain || "Ainda não preenchido"}
                  </p>
                </div>

                {/* Prioridades registradas */}
                <div className="space-y-1 border-t border-border/60 pt-3">
                  <span className="font-semibold text-foreground block">
                    Prioridades ({values.priorities?.filter((p) => p.label?.trim()).length ?? 0}/3):
                  </span>
                  {values.priorities && values.priorities.some((p) => p.label?.trim()) ? (
                    <ul className="space-y-1 text-muted-foreground">
                      {values.priorities
                        .filter((p) => p.label?.trim())
                        .map((p, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 truncate">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{p.label}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground/60 italic">Nenhuma prioridade salva</p>
                  )}
                </div>

                {/* Próximo passo sugerido */}
                <div className="border-t border-border/60 pt-3">
                  {modo === "planejamento" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModo("encerramento")}
                      className="w-full justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <MoonStar className="h-3.5 w-3.5 text-primary" />
                        Ir para Fechamento Noturno
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModo("planejamento")}
                      className="w-full justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <SunMedium className="h-3.5 w-3.5 text-primary" />
                        Voltar ao Planejamento
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </form>
  );
}
