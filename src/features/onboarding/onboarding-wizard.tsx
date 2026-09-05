"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createInstagramAccountAction, saveSettingsAction } from "@/lib/actions/configuracoes";
import { createQuickContentIdea } from "@/lib/actions/content-items";

const PILARES_SUGERIDOS = [
  "Autoridade & Posicionamento",
  "Growth & Alcance",
  "Bastidores & Processo",
  "Inteligência Artificial & Ferramentas",
  "Monetização & Ofertas",
  "Cultura & Lifestyle",
];

const ETAPAS = [
  { id: 1, titulo: "Bem-vinda", icon: Sparkles },
  { id: 2, titulo: "Perfil Instagram", icon: InstagramIcon },
  { id: 3, titulo: "Pilares de Conteúdo", icon: Layers },
  { id: 4, titulo: "Primeira Ideia", icon: Lightbulb },
  { id: 5, titulo: "Pronto!", icon: CheckCircle2 },
];

export function OnboardingWizard() {
  const [etapa, setEtapa] = useState<number>(1);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  // Dados do Passo 2 (Instagram)
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Dados do Passo 3 (Pilares)
  const [pilaresSelecionados, setPilaresSelecionados] = useState<string[]>([
    "Autoridade & Posicionamento",
    "Growth & Alcance",
    "Bastidores & Processo",
  ]);
  const [novoPilar, setNovoPilar] = useState("");

  // Dados do Passo 4 (Ideia)
  const [tituloIdeia, setTituloIdeia] = useState("");
  const [ganchoIdeia, setGanchoIdeia] = useState("");
  const [pilarIdeia, setPilarIdeia] = useState("");

  function togglePilar(pilar: string) {
    setPilaresSelecionados((prev) =>
      prev.includes(pilar) ? prev.filter((p) => p !== pilar) : [...prev, pilar],
    );
  }

  function adicionarPilarPersonalizado() {
    const limpo = novoPilar.trim();
    if (!limpo) return;
    if (!pilaresSelecionados.includes(limpo)) {
      setPilaresSelecionados((prev) => [...prev, limpo]);
    }
    setNovoPilar("");
  }

  // Submissão do Passo 2: Cadastrar Conta Instagram
  function handleCriarConta() {
    setErro(null);
    if (!handle.trim()) {
      setErro("Por favor, informe o @ do seu perfil no Instagram.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("handle", handle.trim().replace(/^@/, ""));
      if (displayName.trim()) {
        formData.set("display_name", displayName.trim());
      }
      formData.set("is_primary", "on");

      const res = await createInstagramAccountAction(formData);
      if (res.error) {
        setErro(res.error);
        return;
      }

      setEtapa(3);
    });
  }

  // Submissão do Passo 3: Salvar Pilares
  function handleSalvarPilares() {
    setErro(null);
    startTransition(async () => {
      if (pilaresSelecionados.length > 0) {
        const formData = new FormData();
        formData.set("pillars", pilaresSelecionados.join("\n"));
        formData.set("stalled_idea_days", "45");
        formData.set("minimum_ideas_per_pillar", "3");
        formData.set("extra", "{}");

        const res = await saveSettingsAction(formData);
        if (res.error) {
          // Não impede de avançar se for erro de validação menor
          console.warn("Aviso ao salvar pilares:", res.error);
        }
      }
      if (pilaresSelecionados.length > 0 && !pilarIdeia) {
        setPilarIdeia(pilaresSelecionados[0]);
      }
      setEtapa(4);
    });
  }

  // Submissão do Passo 4: Salvar Primeira Ideia (ou pular)
  function handleSalvarIdeia(pular: boolean = false) {
    setErro(null);
    if (pular || !tituloIdeia.trim()) {
      setEtapa(5);
      return;
    }

    startTransition(async () => {
      const res = await createQuickContentIdea({
        title: tituloIdeia.trim(),
        hook: ganchoIdeia.trim() || undefined,
        pillar: pilarIdeia || undefined,
      });

      if ("error" in res) {
        setErro(res.error);
        return;
      }

      setEtapa(5);
    });
  }

  function handleFinalizar() {
    router.push("/hoje");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {/* Indicador de Progresso (Stepper) */}
      <nav aria-label="Progresso do Onboarding" className="flex items-center justify-between px-2">
        {ETAPAS.map((item, index) => {
          const Icon = item.icon;
          const ativo = etapa === item.id;
          const concluido = etapa > item.id;

          return (
            <div key={item.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                    concluido
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : ativo
                        ? "border-2 border-primary bg-secondary text-primary font-bold shadow-xs"
                        : "border border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {concluido ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`hidden text-2xs font-medium sm:block ${
                    ativo ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {item.titulo}
                </span>
              </div>
              {index < ETAPAS.length - 1 ? (
                <div
                  className={`h-0.5 w-6 sm:w-12 mx-1 sm:mx-2 transition-colors ${
                    etapa > item.id ? "bg-primary" : "bg-border"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </nav>

      {/* Card Principal de Conteúdo */}
      <Card className="border-border/80 shadow-md">
        {/* PASSO 1: Boas-vindas */}
        {etapa === 1 ? (
          <>
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary shadow-xs">
                <Sparkles className="h-7 w-7" />
              </div>
              <Badge variant="accent" className="mx-auto mb-2">
                Primeiro Acesso
              </Badge>
              <CardTitle className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Boas-vindas ao Cami Content OS
              </CardTitle>
              <CardDescription className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed pt-1">
                Seu espaço central de produção para o Instagram. Vamos configurar seu perfil
                e seus pilares editoriais em menos de 2 minutos.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 sm:px-10">
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground font-medium">Ciclo completo sem planilhas:</strong> da ideia
                    ao roteiro, gravação, edição, agendamento e métricas.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground font-medium">Um único registro vivo:</strong> seu conteúdo
                    avança de etapa sem duplicação ou dados perdidos.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground font-medium">Foco no resultado:</strong> acompanhe objetivos
                    diários, metas mensais e receita atribuída.
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end p-6 sm:px-10 pt-4">
              <Button onClick={() => setEtapa(2)} size="lg" className="w-full sm:w-auto gap-2">
                Começar configuração
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        ) : null}

        {/* PASSO 2: Perfil Instagram */}
        {etapa === 2 ? (
          <>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <InstagramIcon className="h-4 w-4" />
                Passo 1 de 3
              </div>
              <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Conecte seu perfil do Instagram
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Cadastre o perfil principal para organizar suas métricas, ideias e check-ins diários.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="handle" className="text-xs font-medium text-foreground">
                  @ do Instagram <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    @
                  </span>
                  <Input
                    id="handle"
                    placeholder="camilazanoni"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="pl-8"
                    autoFocus
                  />
                </div>
                <p className="text-2xs text-muted-foreground">
                  Digite sem o @ ou deixe que nós ajustamos para você.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="displayName" className="text-xs font-medium text-foreground">
                  Nome de exibição (opcional)
                </Label>
                <Input
                  id="displayName"
                  placeholder="Camila Zanoni"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-2xs text-muted-foreground">
                  Como seu perfil deve ser identificado no cabeçalho do app.
                </p>
              </div>

              {erro ? (
                <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium leading-relaxed">
                  {erro}
                </p>
              ) : null}
            </CardContent>

            <CardFooter className="flex items-center justify-between p-6 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEtapa(1)}
                disabled={isPending}
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={handleCriarConta}
                disabled={isPending || !handle.trim()}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando perfil...
                  </>
                ) : (
                  <>
                    Próximo: Pilares editoriais
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </>
        ) : null}

        {/* PASSO 3: Pilares de Conteúdo */}
        {etapa === 3 ? (
          <>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <Layers className="h-4 w-4" />
                Passo 2 de 3
              </div>
              <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Defina seus pilares de conteúdo
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Selecione os temas centrais sobre os quais você cria conteúdo para manter equilíbrio editorial.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Sugestões clicáveis */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">Temas sugeridos:</Label>
                <div className="flex flex-wrap gap-2">
                  {PILARES_SUGERIDOS.map((pilar) => {
                    const ativo = pilaresSelecionados.includes(pilar);
                    return (
                      <button
                        key={pilar}
                        type="button"
                        onClick={() => togglePilar(pilar)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                          ativo
                            ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                            : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {ativo ? <Check className="h-3 w-3 stroke-[3]" /> : <Plus className="h-3 w-3" />}
                        {pilar}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Adicionar pilar personalizado */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="novoPilar" className="text-xs font-medium text-foreground">
                  Adicionar pilar personalizado:
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="novoPilar"
                    placeholder="Ex.: Lançamento Mentoria"
                    value={novoPilar}
                    onChange={(e) => setNovoPilar(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarPilarPersonalizado();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={adicionarPilarPersonalizado}
                    disabled={!novoPilar.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista ativa */}
              {pilaresSelecionados.length > 0 ? (
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Pilares ativos ({pilaresSelecionados.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pilaresSelecionados.map((pilar) => (
                      <span
                        key={pilar}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {pilar}
                        <button
                          type="button"
                          onClick={() => togglePilar(pilar)}
                          className="hover:opacity-75 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>

            <CardFooter className="flex items-center justify-between p-6 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEtapa(2)}
                disabled={isPending}
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEtapa(4)}
                  className="text-muted-foreground"
                >
                  Pular por agora
                </Button>
                <Button onClick={handleSalvarPilares} disabled={isPending} className="gap-2">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Próximo: Primeira ideia
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </>
        ) : null}

        {/* PASSO 4: Primeira Ideia */}
        {etapa === 4 ? (
          <>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <Lightbulb className="h-4 w-4" />
                Passo 3 de 3 (Opcional)
              </div>
              <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Cadastre sua primeira ideia
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Você já tem algum conteúdo em mente para esta semana? Registre agora para ver seu pipeline funcionar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tituloIdeia" className="text-xs font-medium text-foreground">
                  Título da ideia ou tema <span className="text-primary">*</span>
                </Label>
                <Input
                  id="tituloIdeia"
                  placeholder="Ex.: 3 erros fatais que destroem a retenção dos seus Reels"
                  value={tituloIdeia}
                  onChange={(e) => setTituloIdeia(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ganchoIdeia" className="text-xs font-medium text-foreground">
                  Gancho / Hook inicial (opcional)
                </Label>
                <Input
                  id="ganchoIdeia"
                  placeholder="Ex.: Se os primeiros 3 segundos do seu vídeo não prendem a atenção..."
                  value={ganchoIdeia}
                  onChange={(e) => setGanchoIdeia(e.target.value)}
                />
              </div>

              {pilaresSelecionados.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pilarIdeia" className="text-xs font-medium text-foreground">
                    Pilar editorial associado:
                  </Label>
                  <select
                    id="pilarIdeia"
                    value={pilarIdeia}
                    onChange={(e) => setPilarIdeia(e.target.value)}
                    className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <option value="">Selecione um pilar (opcional)</option>
                    {pilaresSelecionados.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {erro ? (
                <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium">
                  {erro}
                </p>
              ) : null}
            </CardContent>

            <CardFooter className="flex items-center justify-between p-6 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEtapa(3)}
                disabled={isPending}
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSalvarIdeia(true)}
                  disabled={isPending}
                  className="text-muted-foreground"
                >
                  Pular esta etapa
                </Button>
                <Button
                  onClick={() => handleSalvarIdeia(false)}
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Concluir configuração
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </>
        ) : null}

        {/* PASSO 5: Conclusão & Redirecionamento */}
        {etapa === 5 ? (
          <>
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-tone-success-bg text-tone-success-fg shadow-xs">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>
              <Badge variant="secondary" className="mx-auto mb-2 text-tone-success-fg">
                Configuração Concluída
              </Badge>
              <CardTitle className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Tudo pronto para começar!
              </CardTitle>
              <CardDescription className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed pt-1">
                Seu perfil @{handle.replace(/^@/, "") || "seu_perfil"} está configurado e seu
                pipeline editorial está ativo.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 sm:px-10">
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground text-sm">O que fazer agora no seu painel:</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Realize seu <strong>Check-in Diário</strong> para definir o foco e as 3 prioridades de hoje.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Acesse o <strong>Banco de Ideias</strong> para evoluir seus insights até o roteiro.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Grave com o <strong>Teleprompter</strong> ou acompanhe as métricas dos seus posts.</span>
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center p-6 sm:px-10 pt-4">
              <Button onClick={handleFinalizar} size="lg" className="w-full sm:w-auto px-8 gap-2 shadow-sm">
                Ir para o painel Hoje
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        ) : null}
      </Card>
    </div>
  );
}
