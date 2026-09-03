# TODO — Cami Content OS

Plano por etapas. Cada fase deve seguir os critérios de conclusão descritos
em `CLAUDE.md`. Marque itens concluídos com `[x]`.

## Fase 1 — Fundação do projeto ✅ (concluída em 2026-09-03)

- [x] Inspecionar diretório do projeto e o que já existia (pasta vazia).
- [x] Iniciar projeto Next.js (App Router + TypeScript) com Tailwind v4 e ESLint.
- [x] Estrutura de pastas por domínio em `src/features/*` (com READMEs).
- [x] Layout raiz em pt-BR + providers essenciais (`Providers` → TanStack Query).
- [x] Componentes base de UI (`button`, `card`, `badge`) criados manualmente
      (CLI do shadcn bloqueada no sandbox — ver CLAUDE.md).
- [x] Tema visual com a paleta de marca em `globals.css` (Tailwind v4 `@theme`).
- [x] Clientes Supabase (`src/lib/supabase/client.ts` e `server.ts`) — sem
      páginas de auth ainda, só a infraestrutura.
- [x] Lint, TypeScript (tsconfig estrito), Vitest + Testing Library configurados.
- [x] Playwright configurado (config + smoke test) — **execução pendente**,
      ver "Pendências" abaixo.
- [x] `.env.example` sem segredos reais.
- [x] Página inicial temporária (pt-BR) informando que o projeto está configurado.
- [x] README com instalação e comandos.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`
      passando.

### Pendências da Fase 1

- [ ] `npx playwright install chromium` falha no sandbox do Claude Code
      (domínio `cdn.playwright.dev` bloqueado pela allowlist de rede). Rodar
      esse comando manualmente numa máquina/CI com rede irrestrita antes de
      usar `npm run test:e2e`.
- [ ] Repositório Git: `git init` foi feito localmente na pasta do projeto,
      mas **nenhum commit foi criado** (por regra, só commitamos quando você
      pedir explicitamente). Revise o `git status` e peça o primeiro commit
      quando quiser.
- [ ] Projeto Supabase ainda não existe / não foi configurado. `.env.local`
      precisa ser criado manualmente (copie de `.env.example`) com as
      credenciais reais assim que o projeto Supabase for criado.
- [ ] Fonte de marca: o layout usa a pilha de fontes do sistema porque
      `next/font/google` (Geist) precisa de acesso a `fonts.googleapis.com`,
      bloqueado no sandbox. Se quiser a fonte Geist (ou outra), baixe os
      arquivos da fonte e sirva via `next/font/local`.

## Fase 2 — Dados, autenticação e segurança ✅ (concluída em 2026-09-03)

- [x] Login/cadastro via Supabase Auth (e-mail + senha).
- [x] Middleware de sessão (refresh de cookies do Supabase, rotas protegidas
      por padrão fora de uma allowlist pública).
- [x] Página protegida de verificação de sessão (`/sessao`) — não é a tela
      de conta/perfil final, só confirma que auth + dados funcionam.
- [x] RLS habilitado em todas as 14 tabelas, desde a migration que cria
      cada uma.
- [x] Modelagem completa do schema (14 tabelas) via migrations versionadas
      em `supabase/migrations/`, incluindo `content_items` (registro
      central), `content_status_history` (histórico imutável, gerado por
      trigger), `metric_snapshots` (múltiplas leituras por conteúdo, todo
      campo de métrica nullable) e as demais tabelas de apoio.
- [x] Tipos TypeScript de domínio (`src/types/database.ts` e
      `src/types/domain.ts`), escritos manualmente espelhando as migrations
      (regenerar via `npx supabase gen types typescript` quando o projeto
      Supabase real existir).
- [x] Camada de acesso a dados (`src/lib/data/*.ts`, um arquivo por tabela)
      — nenhuma chamada direta ao Supabase espalhada em componentes.
- [x] Seed de desenvolvimento (`supabase/seed.sql`) claramente marcado como
      nunca-aplicar-em-produção, com guarda que impede rodar sem um usuário
      real.
- [x] Testes de integração das migrations/RLS com `@electric-sql/pglite`
      (`supabase/tests/migrations.test.ts`) — prova de forma automatizada
      que não há vazamento de dados entre usuários.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`
      passando.

### Pendências da Fase 2

- [ ] Projeto Supabase real ainda não foi criado — ver "Configurando o
      Supabase" no README.md e a seção correspondente em CLAUDE.md.
- [ ] Página de conta/perfil de verdade (editar nome, fuso horário, avatar)
      ainda não existe — `/sessao` é só uma verificação técnica.
- [ ] Cadastro/login por outros métodos (ex.: magic link, OAuth) não foi
      implementado — só e-mail + senha, conforme escopo desta fase.

## Fase 3 — Design system e shell de navegação ✅ (concluída em 2026-09-03)

- [x] Tokens de cor (claro + escuro), tipografia editorial (serifada em
      títulos), espaçamento, radius, sombras e tons de estado (`globals.css`).
- [x] Tema escuro opcional via `next-themes` (`ThemeToggle`), claro como padrão.
- [x] Componentes base: PageHeader, StatCard (null-safe — nunca mostra "0"
      no lugar de dado ausente), StatusBadge e PriorityBadge (texto + cor +
      ícone), LoadingSkeleton, FilterBar, SearchInput, DateRangePicker,
      ConfirmDialog, FormDrawer.
- [x] Sidebar no desktop (`md:`+) e navegação inferior no mobile com painel
      "Mais" para a árvore completa de rotas.
- [x] Command menu de busca/navegação (Cmd/Ctrl+K, `cmdk`).
- [x] Seletor de conta do Instagram (`AccountSwitcher`) — já preparado para
      1 ou várias contas, e para zero contas (convite para Configurações).
- [x] Todas as 18 rotas do produto criadas com estado vazio elegante e
      descrição curta, sem números mockados (Hoje, Check-in, Ideias,
      Roteiros, Gravação, Edição, Agendamento, Publicados,
      Planejar/Semana, Planejar/Calendário, Metas, Analisar/Conteúdos,
      Analisar/Perfil, Revisão semanal, Dashboard, Negócio/Campanhas,
      Negócio/Receita, Configurações).
- [x] QuickCaptureButton funcional: drawer que salva uma ideia mínima
      (título obrigatório; gancho, pilar e referência opcionais) via Server
      Action (`createQuickContentIdea`), usando a camada de dados da Fase 2.
- [x] Responsividade real em 375px (mobile, bottom nav), tablet e desktop
      (sidebar) com breakpoints Tailwind (`sm:`/`md:`/`lg:`).
- [x] Testes de navegação (Sidebar: grupos, rota ativa via `aria-current`,
      18 rotas presentes) e acessibilidade básica (StatusBadge texto+ícone,
      ConfirmDialog com `role="dialog"` e nome acessível, validação do
      QuickCaptureDrawer).
- [x] `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`
      passando.

### Pendências da Fase 3

- [ ] As 18 rotas ainda são só o "shell" (estado vazio) — nenhuma lista de
      verdade, Kanban, calendário ou gráfico foi implementado ainda; isso é
      o trabalho das Fases 4 a 8 abaixo.
- [ ] `DateRangePicker` é uma versão simples (dois campos de data + atalhos
      7/30/90 dias), sem biblioteca de calendário visual — suficiente por
      enquanto, mas pode evoluir se a usabilidade pedir algo mais visual.
- [ ] Testes de navegação/acessibilidade cobrem os componentes principais,
      não o fluxo de ponta a ponta (isso depende do Playwright, que segue
      bloqueado neste sandbox — ver Pendências da Fase 1).

## Fase 4 — Banco de ideias e páginas de produção (dados de verdade)

> O shell de todas estas rotas já existe (Fase 3), com estado vazio. Falta
> a interface de dados de verdade: listar, editar e mudar status.

- [ ] Banco de ideias: visão em tabela, cards e Kanban (dnd-kit).
- [ ] Regras de negócio do pipeline (score, dias parado, alertas de ideia
      esquecida).
- [ ] Roteiros (edição de roteiro, campos específicos dessa etapa).
- [ ] Gravação (planejador em lote por cenário/roupa/formato/complexidade;
      modo teleprompter).
- [ ] Edição.
- [ ] Agendamento (checklist de qualidade pré-publicação: gancho, CTA,
      legenda, capa, áudio, acessibilidade, link).
- [ ] Publicados (histórico de status, fila de reaproveitamento).

## Fase 5 — Planejamento (dados de verdade)

- [ ] Grade semanal (foco, experimento, conteúdo prioritário).
- [ ] Calendário mensal editorial com arrastar e soltar (dnd-kit).
- [ ] Metas semanais/mensais (ritmo, prazo, risco).

## Fase 6 — Métricas e análise (dados de verdade)

- [ ] Métricas por conteúdo (24h, 7d, 30d, personalizada) — múltiplas
      capturas por conteúdo, nunca sobrescrever a anterior.
- [ ] Métricas do perfil (check-in diário de métricas gerais do Instagram).
- [ ] Índice de performance (nota relativa à própria média, ajustada ao
      objetivo do post).
- [ ] Lembretes automáticos de métricas (pendências para 24h/7d/30d após
      publicar).
- [ ] Revisão semanal (resumo automático + análise estratégica manual +
      decisão registrada para a semana seguinte).
- [ ] Dashboard (visão por período, comparação, conteúdos campeões).
- [ ] Saúde dos pilares (pilares sem ideias, sem posts recentes, em queda).

## Fase 7 — Negócio e Configurações (dados de verdade)

- [ ] Campanhas e receita: listagem e formulários de verdade.
- [ ] Pilares, formatos, objetivos, CTAs, produtos, campanhas e limites —
      todos editáveis pelo usuário em Configurações.

## Fase 8 — Polimento e PWA

- [ ] Manifest + service worker (instalável como PWA).
- [ ] Checklist de acessibilidade completo e Playwright cobrindo os fluxos
      críticos (sidebar/bottom nav responsivos já cobertos na Fase 3).

## Pós-MVP

- [ ] Campanhas, publis, produtos e receita ligados aos conteúdos.
- [ ] Upload e organização de arquivos de vídeo e capa (Supabase Storage).
- [ ] Importação da planilha atual.
- [ ] Integração oficial com Instagram (somente com acesso e permissões
      adequados — nunca simular).
- [ ] Recursos de IA via API (ganchos, roteiros, reaproveitamento, leitura
      semanal da performance).
- [ ] Biblioteca de padrões vencedores (ganchos, estruturas, CTAs, formatos).
- [ ] Resultado por hora investida (tempo × alcance × seguidores × receita).
