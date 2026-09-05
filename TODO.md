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

## Fase 4 — Página Hoje e check-in diário ✅ (concluída em 2026-09-04)

- [x] Migration `checklist_items` + redesenho de `daily_checkins` (por
      usuária, conta e data — `unique (user_id, account_id, checkin_date)`,
      `account_id not null`) + colunas novas em `daily_actions`
      (`checklist_item_id`, `is_active`, `sort_order`).
- [x] `getActiveAccount`/`pickActiveAccount` para resolver a conta de
      contexto (marcada `is_primary`, senão a mais antiga).
- [x] `src/lib/data/hoje.ts` (`getHojeSummary`): planejados hoje, publicados
      hoje, atrasados, métricas pendentes, publicados na semana, meta
      semanal e percentual — tudo via Supabase, sem número mockado.
- [x] Página Hoje: saudação + data, foco do dia (do check-in)/objetivo do
      mês (de Metas), 6 StatCards, prioridades do check-in, conteúdos
      planejados para hoje, pendências acionáveis, atalho para o check-in.
- [x] Checklist personalizável (`checklist_items` + `daily_actions`),
      semeado com 9 itens padrão na primeira abertura do check-in
      (`ensureDefaultChecklistItems`) — marcar/desmarcar e
      ativar/desativar com atualização otimista e rollback em erro.
      Percentual usa só ações ativas do dia
      (`calculateChecklistCompletion`, testado).
- [x] Formulário de Check-in (objetivo, até 3 prioridades com vínculo a
      conteúdo/meta, conteúdo principal, stories planejados,
      produto/campanha em foco, tendência observada, ação de comunidade,
      observações, aprendizado do dia) com autosave de rascunho
      (debounce, `useAutosave`) e feedback de salvamento.
- [x] Fechamento noturno (vitória, bloqueio, aprendizado — mesmo campo do
      dia —, prioridade de amanhã) com ação própria que marca
      `night_closed_at`.
- [x] Duplicidade impedida por constraint única + upsert (nunca insert
      cru); testado via pglite (mesmo dia/conta falha, contas diferentes
      no mesmo dia funcionam, `account_id` obrigatório).
- [x] Testes: cálculo de percentual, parse de prioridades, limites de
      data/semana/mês, autosave (debounce/erro), toggle otimista +
      rollback do checklist, fluxo principal do formulário de check-in.

### Pendências de Gravação/Edição (dentro da Fase 5)

- [ ] Upload de arquivo (vídeo bruto, editado, capa) ainda não é possível
      pela UI — Supabase Storage não está configurado neste projeto.
      `raw_file_url`/`edited_file_url` são só campos de link por enquanto;
      `src/lib/services/file-upload.ts` já tem o contrato pronto para
      integrar quando Storage for configurado (ver Pós-MVP).
- [ ] "Editor responsável" é texto livre (sem tabela de membros de
      equipe/permissões) — não há login separado para um editor terceiro
      revisar ou preencher a própria página.
- [ ] Checklists de gravação (8 itens) e de qualidade da edição (9 itens)
      são fixos, como o de Roteiros — não são customizáveis pela usuária.
- [ ] "Prevenção de perda ao sair" em Edição cobre só `beforeunload`,
      mesma limitação documentada para Roteiros.

### Pendências de Roteiros (dentro da Fase 5)

- [ ] "Prevenção de perda ao sair" cobre fechar aba/recarregar
      (`beforeunload`) mas não navegação interna do App Router (Next.js
      ainda não expõe um bloqueio de navegação estável para Server
      Components/Actions) — se a usuária clicar em outro item do menu com
      rascunho não salvo, não há aviso.
- [ ] O checklist de roteiro (6 itens) é fixo, ao contrário do checklist
      diário do Check-in — não há como a usuária adicionar/remover itens
      dele.
- [ ] Reaproveitamento de conteúdo publicado (`source_content_id`) ainda
      não tem UI própria para pré-preencher um roteiro a partir de um
      conteúdo antigo — fica para quando "Reaproveitar" for implementado.

### Pendências da Fase 4

- [ ] O seletor de conta na barra superior (`AccountSwitcher`, Fase 3)
      ainda não persiste a escolha entre requests — Hoje/Check-in sempre
      usam a conta "ativa" resolvida no servidor (primária ou mais antiga),
      não a que a usuária clicou no dropdown. Vira pendência real quando
      houver mais de uma conta cadastrada de verdade.
- [ ] "Objetivo principal do mês" lê a tabela `goals` (período mensal), mas
      não há ainda uma tela para cadastrar metas (isso é a Fase 6/Metas) —
      por ora, aparece vazio com um link para lá.
- [ ] Edição do template de checklist (renomear/reordenar/remover
      definitivamente um item) não tem UI própria ainda — hoje só é
      possível adicionar um item novo ou desativá-lo para o dia atual.

## Fase 5 — Banco de ideias e páginas de produção ✅ (concluída em 2026-09-04)

> O shell de todas estas rotas já existe (Fase 3), com estado vazio. Falta
> a interface de dados de verdade: listar, editar e mudar status.

- [x] Banco de ideias: visão em tabela, cards e Kanban (dnd-kit), busca,
      filtros combináveis/salvos, ordenação, edição rápida e arquivo.
- [x] Regras de negócio do pipeline (score, dias parado, alertas de ideia
      esquecida).
- [x] Motor central de status: drag-and-drop persistente, histórico via trigger
      e recortes automáticos nas páginas da etapa correspondente.
- [x] Roteiros — lista (researching/scripting/ready_to_record) e workspace
      completo por conteúdo: briefing, até 5 variações de gancho + gancho
      escolhido, roteiro completo, estrutura por blocos (rotulada como
      slides/cenas/telas conforme o formato), texto na tela, lista de
      takes/B-roll, legenda em rascunho, notas de gravação, duração
      estimada e checklist de roteiro (6 itens fixos, orientativo). Autosave
      com debounce + indicador de salvo, histórico básico de versões
      (imutável, com throttle de 3 min no autosave), prevenção de perda ao
      sair (beforeunload), botões voltar etapa/salvar rascunho/marcar
      pronto para gravar, e modo teleprompter (fonte e velocidade
      ajustáveis, iniciar/pausar, espelhar, manter tela acordada quando
      suportado, mobile-friendly). Interface de serviço desacoplada para
      geração futura de ganchos/roteiro por IA (sem integração ainda).
- [x] Gravação — modos lista, cards e sessão em lote sobre
      ready_to_record/recorded; sessão (`recording_sessions`) com data,
      local, cenário, roupa, equipamento, tempo disponível e observações;
      seleção de vários conteúdos para a sessão; ordenação da gravação
      (arrastar ou botões subir/descer) para reduzir trocas de
      cenário/roupa; checklist de gravação por conteúdo (8 itens fixos,
      orientativo, vive em content_items.recording_checklist); cronômetro
      opcional (só na tela, não persiste); ação "Marcar como gravado".
- [x] Edição — lista (recorded/editing/awaiting_approval) com filtros,
      busca e indicador de atraso; workspace completo por conteúdo: links
      de arquivo bruto/editado, editor responsável, instruções de edição,
      referências visuais, notas de cortes/texto na tela/legendas/áudio,
      capa, prazo, checklist de qualidade (9 itens fixos, orientativo),
      comentários/revisões com status aberto/resolvido (podem ser
      reabertos), autosave com indicador de salvo e prevenção de perda ao
      sair. Ações "Iniciar edição", "Enviar para aprovação" e "Aprovar"
      avançam o mesmo content_item (recorded -> editing ->
      awaiting_approval -> scheduled). Upload de arquivo ainda não
      integrado (Supabase Storage não configurado neste projeto) — só
      link por enquanto, com uma interface de serviço desacoplada
      (`src/lib/services/file-upload.ts`) pronta para quando Storage for
      configurado.
- [x] Agendamento — lista (status scheduled) com filtros/busca e workspace
      completo por conteúdo: data/hora planejadas, legenda final,
      palavras-chave/hashtags, CTA, campanha/produto, capa, checklist final
      (6 itens fixos, orientativo), autosave com indicador de salvo. Ação
      "Marcar como publicado" exige data/hora real (CHECK constraint no
      banco + validação no formulário) — nunca fica sem published_at; a URL
      do post é opcional nesse momento e pode ser adicionada depois, com
      alerta visível enquanto faltar.
- [x] Publicados — lista (status published/repurpose) com URL do post,
      data/hora real, resumo de pendências de captura de métricas em
      24h/7d/30d, ação "Duplicar como reaproveitamento" (cria um
      content_item novo com source_content_id, sem alterar o original) e
      comparação lado a lado entre a versão original e a reaproveitada.
      Nenhuma publicação automática no Instagram é simulada — o app só
      gerencia o agendamento e o registro manual de que foi publicado.

### Pendências de Agendamento/Publicados

- [ ] "Marcar/reverter reaproveitamento" (o status `repurpose` em si) não
      tem UI dedicada ainda — só a ação de duplicar foi implementada, que é
      o que o Prompt 8 pediu; sinalizar manualmente um publicado como "na
      fila de reaproveitamento" (sem duplicar) fica para quando houver
      demanda real.
- [ ] Vendas/receita da semana (Planejamento Semanal) somam
      metric_snapshots capturados na semana como aproximação — não há
      ainda um livro-razão financeiro dedicado (ver Fase 8).

## Fase 6 — Planejamento ✅ (concluída em 2026-09-04)

- [x] Grade semanal — foco estratégico, experimento da semana, conteúdo
      prioritário e campanha ativa (upsert em weekly_reviews, reaproveitando
      a mesma linha por semana que a futura Revisão Semanal usará para
      strategic_analysis/decision, Fase 7); estatísticas (planejados,
      publicados, % de execução, seguidores, vendas, receita, horas
      autorrelatadas) e grade diária segunda-domingo.
- [x] Calendário mensal editorial com arrastar e soltar (dnd-kit) — só
      conteúdos agendados (status scheduled) podem ser arrastados;
      reagendar troca só a data, preservando o horário planejado. Filtros
      por formato/pilar/objetivo/status/campanha, indicadores de dia
      vazio/excesso de publicações, resumo do mês por formato/pilar e
      datas importantes editáveis (`calendar_important_dates`, tabela
      nova, com CRUD completo).

### Pendências do Calendário

- [ ] Visão semanal do calendário (o Prompt 8 pedia "visual mensal e
      semanal") ainda não tem uma tela própria — só a grade diária de
      Planejamento Semanal cobre parcialmente essa necessidade; um toggle
      mês/semana no próprio Calendário fica para quando houver demanda.
- [x] Metas semanais/mensais (ritmo, prazo, risco) — implementado no
      Prompt 10 (`/metas`); ver Fase 7 abaixo.

## Fase 7 — Métricas e análise (dados de verdade) ✅ (Prompt 9 em 2026-09-04, Prompt 10 em 2026-09-04, Prompt 11 em 2026-09-04)

- [x] Métricas por conteúdo (24h, 7d, 30d, personalizada) — múltiplas
      capturas por conteúdo, nunca sobrescrevendo a anterior (janela fixa é
      upsert; personalizada sempre pode ganhar uma nova leitura).
      Formulário rápido e completo no mesmo drawer
      (`src/features/metricas/metric-capture-drawer.tsx`).
- [x] Métricas do perfil (registro diário de métricas gerais do Instagram)
      — implementado no Prompt 10 (`/metricas/perfil`): seguidores, alcance,
      views, conversão e negócio, com ganhos/crescimento %, variações,
      médias móveis de 7/30 dias, cruzamento com conteúdos publicados,
      receita acumulada do mês e resultado por hora (`src/lib/perfil.ts`).
- [x] Índice de performance (nota relativa à própria média, ajustada ao
      objetivo do post) — `computePerformanceIndex`, `src/lib/metricas.ts`.
- [x] Lembretes automáticos de métricas (pendências para 24h/7d/30d após
      publicar) — já existia em Publicados (Prompt 8) e agora também
      aparece em Métricas dos Conteúdos.
- [x] Metas semanais/mensais (progresso e status sempre recalculados ao
      vivo, nunca digitados à mão) — implementado no Prompt 10 (`/metas`),
      catálogo fechado de 12 métricas (`src/lib/metas.ts`), metas-padrão
      configuráveis (`app_settings.extra.default_goals`).
- [x] Revisão semanal (`/revisao-semanal`, Prompt 11) — compara a semana com
      a anterior de mesmo tamanho (planejados, publicados, execução, views,
      alcance, engajamento, taxa, compartilhamentos, salvamentos,
      seguidores, visitas, cliques, leads, vendas, receita, horas e
      resultado por hora), melhores da semana (conteúdo/formato/pilar/
      dia/horário, por índice de performance com base histórica ampla —
      não só a amostra da semana), resumo automático em uma frase (nunca
      fabrica dado ausente) e 7 campos manuais estruturados — ver
      `src/lib/revisao-semanal.ts`.
- [x] Dashboard (`/dashboard`, Prompt 11) — filtro por período (livre, não
      só semana), formato, pilar, objetivo, campanha, CTA, produto e
      janela de análise (24h/7d/30d); comparação com o período anterior
      equivalente; cards principais; evolução de seguidores; alcance e
      views por dia; planejado vs. publicado; desempenho por formato/
      pilar/objetivo; top conteúdos por índice e por seguidores; progresso
      das metas do período — ver `src/lib/dashboard.ts`.
- [x] Central de alertas (`/alertas`, Prompt 11) — 7 tipos (atrasado,
      publicado sem URL, métrica 24h/7d/30d pendente, ideia parada
      >45 dias, pilar com <3 ideias — cobre "saúde dos pilares" abaixo,
      meta em risco, campanha/prazo de produção vencendo em até 3 dias),
      sempre recalculados ao vivo (nunca persistidos); só a dispensa/
      adiamento da usuária é salva (`alert_dismissals`, chave estável por
      ocorrência) — ver `src/lib/alerts.ts`.

### Pendências de Métricas dos Conteúdos

- [ ] A média histórica de cada componente do índice inclui o próprio
      conteúdo sendo comparado (não exclui "a si mesmo" da própria base) —
      simplificação deliberada para uma base pequena; excluir o item
      exigiria recalcular a base inteira por conteúdo. Documentado em
      `buildPerformanceBaselines` (`src/lib/metricas.ts`).
- [ ] As faixas do índice (abaixo de 70/70–119/120–299/300+) já são
      configuráveis no modelo (`app_settings.extra.performance_index_thresholds`,
      `getPerformanceIndexThresholds`), mas não há tela em Configurações
      para editá-las ainda — só o valor padrão do Prompt 9 está em uso.
- [ ] Os pesos de cada componente por objetivo (`DEFAULT_OBJECTIVE_WEIGHTS`)
      são fixos no código, não editáveis pela usuária.

### Pendências de Métricas do Perfil e Metas (Prompt 10)

- [ ] Metas não são filtradas por conta do Instagram — seguidores, alcance,
      receita etc. são agregados entre todas as contas cadastradas. Mesma
      simplificação já existente em `weekly-plan.ts` para o delta de
      seguidores; um seletor de conta em Metas fica para quando houver
      demanda real (produto hoje é uso pessoal, poucas contas).
- [ ] `goals.achieved_value` existe no banco desde a Fase 2 mas continua
      sem uso deliberadamente — o valor atual de uma meta é sempre
      recalculado ao vivo (`computeGoal`, `src/lib/metas.ts`), nunca lido
      de uma coluna que poderia ficar desatualizada.
- [ ] Os limites do status de meta (quando entra "em risco", "atingida",
      "superada") já são configuráveis no modelo
      (`app_settings.extra.goal_status_thresholds`,
      `getGoalStatusThresholds`, mesmo padrão do índice de performance),
      mas não há tela em Configurações para editá-los — só o padrão do
      Prompt 10 está em uso. "Metas-padrão" (a funcionalidade pedida no
      Prompt 10) cobre só o valor-alvo sugerido por métrica, não estes
      limites — interpretação deliberada, mais estreita, do pedido original.
- [ ] "Conteúdos publicados" existe em dois lugares com sentidos
      diferentes: um campo autodeclarado em Métricas do Perfil
      (`profile_snapshots.posts_count`, o que a pessoa digita) e um cálculo
      cruzado com o pipeline real (`contentPublishedOnDate`, quantos
      `content_items` têm `published_at` naquele dia) — os dois aparecem
      lado a lado na tabela de Perfil para que a divergência (ex.: um post
      feito fora do Content OS) fique visível, não escondida.
- [ ] "Resultado por hora investida" usa `revenue` como o "resultado" (é o
      campo mais concreto e diretamente monetário disponível) — poderia no
      futuro virar uma escolha configurável (ex.: leads por hora, vendas
      por hora) em vez de fixo em receita.
- [ ] Sem seletor de conta na tela de Métricas do Perfil — a tabela mostra
      registros de todas as contas juntos (com a coluna de conta implícita
      só no formulário); um filtro por conta fica para quando houver mais
      de uma conta cadastrada de verdade.

### Pendências de Revisão Semanal, Dashboard e Alertas (Prompt 11)

- [ ] `weekly_reviews.strategic_analysis` (coluna da Fase 2) ficou
      obsoleta — os 6 campos estruturados do Prompt 11 (`what_worked`,
      `what_didnt_work`, `what_to_repeat`, `what_to_stop`, `what_to_test`,
      `key_learning`) a substituem. A coluna antiga foi mantida só por
      compatibilidade (comentário no banco explica); nada mais escreve nela.
- [ ] O alerta de "conteúdo atrasado" (`src/lib/alerts.ts`) usa um critério
      próprio (scheduled_at OU production_due_at vencido, status não
      terminal) — deliberadamente NÃO unificado com `editing.ts#isOverdue`
      (só olha production_due_at) nem com a query de `hoje.ts` (mesmo
      critério amplo, mas outra implementação). Unificar os três é seguro
      só quando alguém revisar os três comportamentos juntos — misturar
      agora arriscava regressão em duas telas que já funcionam.
- [ ] Alertas dispensados/adiados não têm UI para "desfazer" ainda — a
      função `clearAlertDismissal` já existe em
      `src/lib/data/alert-dismissals.ts`, falta só o botão em algum lugar
      (ex.: uma lista de "alertas dispensados" dentro de Alertas).
- [ ] A janela de aviso de "campanha/prazo vencendo" é fixa em 3 dias
      (`deadlineWarningDays` em `computeAlerts`, `src/lib/alerts.ts`) — não
      é configurável pela usuária ainda.
- [ ] O alerta de campanha vencendo linka para `/negocio/campanhas`, que
      ainda é a tela placeholder da Fase 8 (sem CRUD de verdade) — quando
      essa tela for implementada, o alerta já aponta para o lugar certo,
      não precisa de mudança.
- [ ] "Melhor formato/pilar/dia/horário" (Revisão Semanal e Dashboard)
      calculam a média do índice de performance com a amostra do próprio
      período selecionado — com poucos conteúdos publicados na semana/
      período, o resultado pode ter uma amostra pequena (`sampleSize`
      exposto no dado, mas ainda sem aviso visual de "amostra pequena" na
      interface).
- [ ] Filtros do Dashboard (período, formato, pilar, objetivo, campanha,
      CTA, produto, janela de análise) vivem só no estado do componente —
      não são refletidos na URL, então recarregar a página ou compartilhar
      o link perde a seleção. Mesma limitação não existe em Revisão
      Semanal, que usa `?week=` na URL.
- [ ] `getWeekWindowSources` (`src/lib/data/revisao-semanal.ts`) não
      filtra por conta do Instagram (mesma simplificação já documentada em
      `weekly-plan.ts`/`metas.ts` — produto hoje é uso pessoal, poucas
      contas).

## Fase 8 — Negócio e Configurações (dados de verdade)

- [x] Campanhas e receita (Prompt 12, concluído em 2026-09-04): campanhas e
      parcerias com status independentes, contatos, prazos, cachê, entregáveis,
      conteúdos, parcelas/recebimentos; produtos, vendas manuais ou derivadas
      de uma captura de métricas; resumo financeiro por período, metas,
      conversões, próximos pagamentos/entregas e alertas.
- [ ] Pilares, formatos, objetivos, CTAs, produtos, campanhas e limites —
      todos editáveis pelo usuário em Configurações.

### Pendências de Campanhas e Receita (Prompt 12)

- [x] Aplicar a migration `20260904190000_campanhas_receita.sql` no projeto
      Supabase real — aplicada no Prompt 14 (estava com schema desatualizado
      havia meses; as 3 tabelas de campanhas/receita não existiam no banco
      real antes disso).
- [ ] Moeda fica preparada no modelo (`currency` ISO de 3 letras), mas a UI
      desta fase opera em BRL, conforme o escopo atual.
- [ ] Responsável continua texto livre; equipe/membros com login e permissões
      próprias não existe no produto.
- [ ] A atribuição manual depende de disciplina: quando os números vierem de
      Métricas, selecionar a captura existente. O banco impede repetir a mesma
      captura, mas não consegue deduzir que uma linha manual digitada sem
      vínculo representa a mesma venda.

## Fase 9 — Polimento e PWA

### Prompt 13 — Configurações, importação e backup (concluído)

- [x] Configurações por usuário, taxonomias auditáveis, séries e checklist padrão.
- [x] Upload XLSX, prévia, validação, confirmação, lote transacional e idempotência por SHA-256.
- [x] Reconciliação de Banco de Ideias e Conteúdos pelo ID legado sem duplicar `content_items`.
- [x] Exportação CSV por módulo/período e backup JSON completo versionado.
- [x] Aplicar `20260904200000_configuracoes_importacao_backup.sql` no Supabase real (confirmado aplicado).
- [ ] Validar o mapeamento final com `CENTRAL DA INFLUENCER - CAMILA ZANONI.xlsx` quando o arquivo real estiver disponível.
- [ ] Restauração JSON automática ficou deliberadamente fora do escopo; procedimento manual em `docs/restauracao-backup.md`.

- [x] Manifest + service worker (instalável como PWA, Prompt 14 — ver seção abaixo).
- [ ] Checklist de acessibilidade completo e Playwright cobrindo os fluxos
      críticos (sidebar/bottom nav responsivos já cobertos na Fase 3).

## Fase 10 — Auditoria, estabilização, PWA e preparação para produção (Prompt 14) ✅ (concluída em 2026-09-04)

Fase de auditoria, não de novas funcionalidades. Baseline antes de editar:
441 testes / 40 arquivos, lint e typecheck limpos, build passando (30 rotas)
— já era o estado real do projeto no início desta fase, sem falhas prévias
para herdar.

### Corrigido nesta fase

- [x] Migration do Prompt 12 (`campanhas_receita`) nunca tinha sido aplicada
      no projeto Supabase real — aplicada e confirmada (3 tabelas + RLS).
- [x] 74 avisos de performance de RLS (`auth_rls_initplan`): toda policy
      pré-Prompt-12 usava `auth.uid()` cru, reavaliado por linha —
      reescritas para `(select auth.uid())`. Mudança de performance pura,
      nenhuma policy teve sua semântica de autorização alterada.
- [x] Open redirect: `?next=`/`?proximo=` do login e do callback OAuth
      agora validados por `src/lib/safe-redirect.ts` (só aceita caminho
      interno relativo).
- [x] Injeção de fórmula em export CSV (`src/lib/backup.ts`): valores que
      começam com `= + - @` agora são prefixados com `'` antes de serem
      escritos.
- [x] `saveSettingsAction` e criação de conta do Instagram não validavam
      entrada com Zod — corrigido (`src/lib/validations/configuracoes.ts`,
      `src/lib/validations/instagram-accounts.ts`). Tela "Contas do
      Instagram" em Configurações também estava sem formulário de criação —
      adicionada.
- [x] URLs de campanha (briefing/contrato/pasta/publicação) aceitavam texto
      livre — agora validadas como URL.
- [x] `weekly_publish_target` em branco virava `0` — corrigido para `null`
      (regra "ausência ≠ zero").
- [x] Fuso horário: vários pontos da UI formatavam datas com
      `.toLocaleDateString()`/`.toLocaleString("pt-BR")` sem `timeZone`,
      violando a regra de `America/Sao_Paulo` fixo — 10 arquivos corrigidos,
      usando os novos helpers `formatDateBR`/`formatDateTimeBR`
      (`src/lib/dates.ts`).
- [x] Pós-login mandava toda usuária real para `/sessao` (página de
      diagnóstico, nunca foi uma tela de produto) em vez da rota que ela
      tentou acessar (`?proximo=`) ou de `/hoje`. Corrigido no middleware e
      no formulário de login.
- [x] `prefers-reduced-motion: reduce` não era respeitado em nenhum lugar —
      adicionada regra global em `globals.css`.
- [x] Doc: contagem "27 tabelas" em `CLAUDE.md` estava desatualizada (não
      contava `alert_dismissals`, do Prompt 11) — corrigida para 28.
- [x] Cenário de teste obrigatório que faltava (login + proteção de rota) —
      adicionado `src/lib/supabase/middleware.test.ts` (5 testes).

### PWA implementado (sem biblioteca de terceiros)

- [x] `public/manifest.webmanifest` + ícones (192/512/512-maskable/
      apple-touch) gerados com a paleta de marca.
- [x] `public/sw.js` — cache só de assets estáticos e do shell de rota,
      nunca de respostas autenticadas; atualização só quando a usuária
      confirma o banner (nunca troca a versão em uso sem aviso).
- [x] `src/app/offline/page.tsx` + banner de offline
      (`src/providers/pwa-provider.tsx`): honesto sobre não haver fila de
      mutação offline — escrita é bloqueada com mensagem clara em vez de
      fingir sincronização futura (decisão deliberada: implementar uma fila
      exigiria idempotência + resolução de conflito + indicação de
      sincronização, que o app não tem).

### Verificado e não alterado (auditoria confirmou que já funciona)

- [x] Isolamento entre usuárias (RLS): já extensivamente coberto por
      `supabase/tests/migrations.test.ts` (pglite) para praticamente toda
      tabela sensível — cenário obrigatório "provar isolamento entre duas
      usuárias de teste" já satisfeito antes desta fase.
- [x] Invalidação de cache após mutação: todas as 15 Server Actions em
      `src/lib/actions/` chamam `revalidatePath`/`revalidateTag`.
- [x] Estados de carregando/vazio/erro: componentes compartilhados
      (`src/components/feedback/states.tsx`) usados de forma consistente.
- [x] N+1: nenhum padrão relevante de N+1 encontrado na camada de dados,
      exceto um loop sequencial de updates em
      `reorderRecordingSessionItems` (`src/lib/data/recording-sessions.ts`)
      — uma query por item ao reordenar uma sessão de gravação. Impacto
      baixo (listas pequenas, ação pouco frequente); não corrigido nesta
      fase — ver Pendências.
- [x] Segredos: nenhuma chave/token real encontrado em código, histórico ou
      arquivos de configuração; `SUPABASE_SERVICE_ROLE_KEY` não é referenciada
      em nenhum componente client-side.

### Auditoria visual e responsiva

- [x] `/`, `/login` e `/offline` verificadas com screenshot real
      (Playwright + Chromium) em 375px/768px/1440px — 9 combinações, nenhum
      defeito visual observado (sem overlap, sem corte de texto, sem scroll
      horizontal indesejado).
- [ ] Telas autenticadas (`/hoje`, `/dashboard`, `/ideias` etc.) não foram
      verificadas visualmente nesta fase — exigiria criar uma usuária de
      teste descartável no projeto Supabase real, e a fase priorizou não
      tocar em dados/usuários reais sem pedido explícito. Ver Pendências.

### Pendências / limitações conhecidas após o Prompt 14

- [ ] Cobertura visual das telas autenticadas ainda não feita (ver acima).
- [ ] `AccountSwitcher` (troca de conta do Instagram na navegação) é
      cosmético — não persiste a conta escolhida entre requisições.
      Documentado, não corrigido (baixo risco, sem perda de dados).
- [ ] `replaceTaxonomyAction` existe na camada de ações mas não tem UI que
      o alcance (ação inacessível pela interface). Documentado, não
      corrigido.
- [ ] `reorderRecordingSessionItems` faz uma query por item ao reordenar
      (ver acima) — otimização de performance de baixo impacto, não feita
      nesta fase.
- [ ] `isOverdue` tem três implementações levemente diferentes em telas
      distintas (já documentado antes desta fase como aceitável dado o
      contexto de cada tela); não alterado.
- [ ] `clearAlertDismissal` não tem UI própria (só é chamado
      internamente); documentado, não corrigido.
- [ ] Filtros do Dashboard não são refletidos na URL (diferente de Revisão
      Semanal, que usa `?week=`); documentado, não corrigido.
- [ ] Arquivo temporário `_audit_snapshot.tar.gz` (usado para testar
      visualmente o app num sandbox à parte) foi movido para
      `_to_delete/` na raiz do projeto porque o ambiente não teve permissão
      de apagar arquivos nesta sessão — pode ser excluído manualmente.

## Pós-MVP

- [x] Campanhas, publis, produtos e receita ligados aos conteúdos (Prompt 12).
- [ ] Upload e organização de arquivos de vídeo e capa (Supabase Storage).
- [ ] Importação da planilha atual.
- [ ] Integração oficial com Instagram (somente com acesso e permissões
      adequados — nunca simular).
- [ ] Recursos de IA via API (ganchos, roteiros, reaproveitamento, leitura
      semanal da performance).
- [ ] Biblioteca de padrões vencedores (ganchos, estruturas, CTAs, formatos).
- [ ] Resultado por hora investida (tempo × alcance × seguidores × receita).
