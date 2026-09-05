import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, Sparkles, Video, CalendarCheck, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar — Cami Content OS",
  description: "Acesse sua conta do Cami Content OS e gerencie todo o seu ciclo de conteúdo.",
};

const BENEFICIOS_FLUXO = [
  {
    icon: Sparkles,
    titulo: "Ideias e Roteiros Vivos",
    descricao: "Um único registro que evolui de insight a roteiro sem retrabalho.",
  },
  {
    icon: Video,
    titulo: "Gravação e Edição Fluida",
    descricao: "Teleprompter integrado e direcionamento cirúrgico de cortes.",
  },
  {
    icon: CalendarCheck,
    titulo: "Agendamento e Postagem",
    descricao: "Visão em calendário e consistência semanal sem estresse.",
  },
  {
    icon: BarChart3,
    titulo: "Métricas Reais e Negócio",
    descricao: "Rastreio de vendas atribuídas, metas e reaproveitamento inteligente.",
  },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col lg:flex-row">
      {/* Coluna do Formulário de Acesso (Primeira dobra no Mobile, Direita no Desktop) */}
      <section className="order-1 lg:order-2 flex flex-1 items-center justify-center p-5 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Logo compacto visível apenas no Mobile acima do formulário */}
          <div className="flex items-center justify-center gap-2.5 lg:hidden pt-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-sans font-bold text-lg shadow-xs">
              C
            </div>
            <div>
              <span className="font-sans font-bold tracking-tight text-foreground text-lg block leading-none">
                Cami Content OS
              </span>
              <span className="block text-2xs uppercase tracking-widest text-primary font-semibold mt-1">
                Sistema Operacional Criativo
              </span>
            </div>
          </div>

          <Card className="border-border/80 shadow-md">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Acesse sua área de trabalho
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                Gerencie seus pilares, roteiros, gravações e métricas com segurança.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Coluna Editorial / Branding (Abaixo do formulário no Mobile, Esquerda no Desktop) */}
      <section className="order-2 lg:order-1 relative flex flex-col justify-between overflow-hidden bg-muted/40 p-6 sm:p-10 lg:w-1/2 lg:p-16 border-t lg:border-t-0 lg:border-r border-border/70">
        {/* Glow de fundo sutil */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/8 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/8 blur-3xl"
        />

        {/* Topo / Logo Desktop */}
        <div className="relative z-10 hidden lg:flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-sans font-bold text-lg shadow-xs">
            C
          </div>
          <div>
            <span className="font-sans font-bold tracking-tight text-foreground text-lg">
              Cami Content OS
            </span>
            <span className="block text-2xs uppercase tracking-widest text-primary font-semibold">
              Sistema Operacional Criativo
            </span>
          </div>
        </div>

        {/* Mensagem Central */}
        <div className="relative z-10 my-4 flex flex-col gap-5 sm:my-8 lg:my-12">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-secondary/80 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Gestão Editorial de Alto Padrão
            </span>
            <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-[1.15]">
              Seu conteúdo, da ideia ao resultado.
            </h1>
            <p className="max-w-lg text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Um fluxo contínuo projetado para transformar intenção criativa em consistência,
              audiência qualificada e vendas no Instagram.
            </p>
          </div>

          {/* Destaques do Fluxo */}
          <div className="grid gap-3 sm:grid-cols-2">
            {BENEFICIOS_FLUXO.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.titulo}
                  className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-xs transition-colors hover:border-primary/30"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">{item.titulo}</p>
                    <p className="text-2xs text-muted-foreground leading-tight">{item.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé do Painel Editorial */}
        <div className="relative z-10 pt-4 text-xs text-muted-foreground flex items-center justify-between border-t border-border/60">
          <p className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-tone-success-fg" />
            Um único registro por ideia, sem duplicidade.
          </p>
          <span className="text-2xs font-mono text-muted-foreground/80">v1.0 · Cami OS</span>
        </div>
      </section>
    </main>
  );
}
