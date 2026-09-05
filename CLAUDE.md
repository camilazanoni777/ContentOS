# CLAUDE.md

Guia de contexto para trabalhar neste repositório com Claude Code (ou
qualquer outro agente/desenvolvedor). Leia isto antes de implementar
qualquer funcionalidade nova.

## Visão do produto

**Cami Content OS** — nome provisório — é um sistema único para gestão da
criação de conteúdo no Instagram da Cami. Cobre o fluxo completo:

```
capturar ideia → pesquisar → roteirizar → preparar gravação → gravar →
editar → aprovar → agendar → publicar → medir → aprender → reaproveitar
```

O app **não** deve reproduzir uma planilha aba por aba. Ele transforma essa
lógica num fluxo natural de produção de conteúdo.

### Princípio central (não negociável)

**Uma ideia é UM único registro**, que muda de `status` ao avançar pelo
pipeline. Ela nunca é copiada/duplicada entre páginas. Cada página de
produção (Roteiros, Gravação, Edição, Agendamento, Publicados) é uma
**visão filtrada** desse mesmo banco central de conteúdos — nunca uma
tabela separada.

### Estados do conteúdo (campo `status` único)

Ordem padrão do pipeline (valor do enum `content_status` no banco → rótulo em pt-BR):

1. `idea` → Ideia
2. `researching` → Em pesquisa
3. `scripting` → Roteiro
4. `ready_to_record` → Pronto para gravar
5. `recorded` → Gravado
6. `editing` → Em edição
7. `awaiting_approval` → Aguardando aprovação
8. `scheduled` → Agendado
9. `published` → Publicado
10. `repurpose` → Reaproveitar
11. `archived` → Arquivado
12. `canceled` → Cancelado

Os valores do enum e os rótulos em pt-BR ficam centralizados em
`src/types/domain.ts` (`CONTENT_STATUS_ORDER`, `CONTENT_STATUS_LABELS`) —
nunca reescreva essas strings soltas em outro lugar.

É permitido voltar etapas ou pular etapas. **Toda mudança de status gera
automaticamente uma linha em `content_status_history`** (trigger
`log_content_item_status_change`, migration
`20260903210600_content_status_history.sql`) — isso já está implementado
desde a Fase 2, não é mais uma pendência futura.

## Stack

- **Next.js (App Router) + TypeScript** — `src/app`
- **Tailwind CSS v4** (config CSS-first via `@theme` em `globals.css`, sem
  `tailwind.config.js`) + **shadcn/ui** (componentes manuais — ver nota
  abaixo)
- **Supabase** — autenticação, Postgres, RLS, Storage (`@supabase/ssr` +
  `@supabase/supabase-js`)
- **React Hook Form + Zod** para formulários e validação
- **TanStack Query** para estado de servidor (`src/providers/query-provider.tsx`)
- **Recharts** para gráficos
- **dnd-kit** para Kanban e calendário com arrastar e soltar
- **date-fns** com locale pt-BR
- **Vitest + Testing Library** para testes unitários/componente
- **Playwright** para fluxos críticos (e2e)
- PWA responsiva (instalável) — manifest/service worker ainda não
  implementados (fase futura)

### Nota importante: shadcn/ui sem CLI

O domínio `ui.shadcn.com` (usado pelo `npx shadcn init` e `npx shadcn add`)
**é bloqueado pela allowlist de rede** no ambiente sandboxed usado para
desenvolver este projeto via Claude Code. Por isso:

- `components.json` foi criado manualmente, seguindo a convenção shadcn
  (style "new-york", CSS variables, alias `@/components`, `@/lib/utils` etc.).
- Os componentes em `src/components/ui/` (`button.tsx`, `card.tsx`,
  `badge.tsx`) foram escritos manualmente, replicando fielmente o código-fonte
  padrão do shadcn/ui para esses componentes.
- Se você (humano ou agente) tiver acesso de rede irrestrito, `npx shadcn add
  <componente>` deve funcionar normalmente para adicionar novos componentes —
  ele vai respeitar o `components.json` existente. Só não confie que isso
  funcione dentro do ambiente sandboxed do Claude Code sem antes testar.
- Pelo mesmo motivo, **não use `next/font/google`** (ex.: Geist) — o build
  falha sem acesso a `fonts.googleapis.com`. O layout raiz usa uma pilha de
  fontes do sistema (`-apple-system, ... sans-serif`). Se quiser uma fonte de
  marca específica, prefira `next/font/local` com o arquivo da fonte
  versionado no repo.

### Preservar stack existente

Se este repositório já tiver uma stack equivalente funcionando, **preserve-a
em vez de migrar sem necessidade**. Este documento descreve a stack como
implementada na fundação inicial (fase 1); se ela mudar, atualize esta seção.

## Arquitetura de pastas

```
src/
  app/                    # Rotas (App Router). Fino: delega para src/features.
  features/<dominio>/     # Um domínio por pasta (ideias, roteiros, gravacao,
                           # edicao, agendamento, publicados, planejamento,
                           # metricas, metas, negocio, configuracoes, hoje,
                           # checkin). Cada domínio guarda seus próprios
                           # componentes, hooks e schemas quando específicos
                           # dele; o que for compartilhado sobe para
                           # src/components, src/hooks, src/lib/validations.
  components/
    ui/                   # Componentes shadcn/ui (button, card, badge, ...)
    layout/                # Sidebar, navegação inferior, header, captura rápida
  lib/
    supabase/              # client.ts (browser) e server.ts (server components)
    validations/           # Schemas Zod compartilhados entre domínios
    utils.ts                # cn() e outros helpers puros
  providers/                # Composição de providers (Providers em index.tsx)
  hooks/                     # Hooks reutilizáveis entre domínios
  types/                     # Tipos de domínio compartilhados (a criar quando
                              # o banco de ideias for implementado)
  test/                      # setup.ts do Vitest
tests/e2e/                   # Specs do Playwright
```

Cada pasta de domínio em `src/features/` tem um `README.md` curto
explicando seu propósito — atualize-o conforme a funcionalidade for
implementada.

## Padrões de código

- **Idioma da interface e dos textos visíveis ao usuário: português do
  Brasil.** Comentários e nomes de código podem ser em português ou inglês —
  siga o que já existe no arquivo que você está editando.
- **Datas e timezone**: sempre armazenar com timezone; exibir formatado em
  pt-BR (`date-fns` + `locale: ptBR`). Timezone padrão do produto:
  `America/Sao_Paulo` (ver `.env.example`).
- **Campo não informado é `null`, nunca `0`.** Zero é um valor real de
  métrica; ausência de dado é `null`. Isso vale para toda a camada de dados
  (Supabase, formulários, cálculos).
- **Nunca duplicar o registro de conteúdo.** Mudar de etapa = mudar o campo
  `status` do mesmo registro, não criar um novo.
- **Nunca usar dados mockados como se fossem reais** depois da fase de
  fundação. Cards, gráficos e relatórios devem ler do Supabase assim que a
  camada de dados existir.
- **Exclusão é arquivar por padrão.** Exclusão permanente exige confirmação
  explícita do usuário.
- **RLS obrigatório**: toda tabela no Supabase deve ter Row Level Security
  habilitado e políticas por usuário (`auth.uid()`), desde a criação da
  tabela — nunca como um passo "depois".
- **Componentes de UI**: siga a convenção shadcn/ui (CVA para variantes,
  `cn()` para merge de classes, `forwardRef` em componentes de baixo nível).
- **Server vs. Client Components**: prefira Server Components por padrão;
  marque `"use client"` só onde há interatividade, hooks de estado/efeito ou
  os providers.
- **Sem integração real com Instagram** até que isso seja explicitamente
  pedido e as permissões/API estejam definidas. Não simule dados de Instagram
  como se fossem reais.

## Banco de dados, autenticação e RLS (Fase 2)

### As 28 tabelas

Todas em `public`, todas com `user_id uuid references auth.users` (exceto
`content_status_history`, que também tem `user_id` mas se relaciona
principalmente via `content_item_id`, e `profile_snapshots`/
`instagram_accounts`, que se relacionam via `account_id`/tabela própria) e
todas com RLS habilitado desde a migration que as cria:

`profiles`, `app_settings`, `instagram_accounts`, `content_series`,
`campaigns`, `products`, `content_items` (registro central), 
`content_status_history` (histórico imutável), `metric_snapshots`,
`profile_snapshots`, `daily_checkins`, `daily_actions`, `checklist_items`
(template do checklist do check-in, Fase 4), `goals`, `weekly_reviews`,
`content_script_versions` (histórico imutável de versões do roteiro,
Prompt 6), `recording_sessions` e `recording_session_items` (sessão de
gravação em lote, Prompt 7), `content_review_comments` (comentários/revisões
de edição, com status aberto/resolvido — não é imutável, Prompt 7),
`calendar_important_dates` (datas importantes editáveis do calendário
editorial, Prompt 8).

As três tabelas acrescentadas no Prompt 12 são `campaign_deliverables`
(entregáveis estruturados), `campaign_payments` (parcelas e recebimentos
parciais reais) e `sales_records` (livro-razão de atribuição de vendas).

O Prompt 13 acrescentou `taxonomy_options`, `taxonomy_change_audit`,
`import_batches` e `import_entity_links`. Importações guardam somente payload
sanitizado e relatório, nunca o arquivo XLSX original. A aplicação de um lote
confirmado ocorre em `apply_import_batch`, numa transação Postgres idempotente.

O Prompt 11 acrescentou `alert_dismissals` (dispensa de alertas do dashboard
por usuária, chave única por `user_id` + tipo de alerta).

### Check-in diário (Fase 4)

`daily_checkins` é **por usuária, conta do Instagram e data**
(`unique (user_id, account_id, checkin_date)`, `account_id not null`) — não
só por dia. Isso significa que fazer check-in exige ter pelo menos uma
`instagram_accounts` cadastrada; sem isso, `/checkin` mostra um estado que
convida a cadastrar uma conta em Configurações em vez de bloquear
silenciosamente. A conta "ativa" é resolvida por
`getActiveAccount()` (`src/lib/data/instagram-accounts.ts`): conta marcada
`is_primary`, senão a mais antiga cadastrada — o seletor de conta na barra
superior ainda não persiste a escolha entre páginas (pendência, ver
TODO.md).

O checklist diário (`checklist_items` = template personalizável por
usuária; `daily_actions` = instância do dia, com `is_active` podendo
desativar um item só para aquele dia sem apagar o template) é semeado com 9
itens padrão na primeira vez que a usuária abre o check-in
(`ensureDefaultChecklistItems`, `src/lib/data/checklist-items.ts`) — não
pelo trigger `handle_new_user()`, para funcionar também para contas criadas
antes desta fase.

Migrations em `supabase/migrations/`, aplicadas nessa ordem pelo timestamp
no nome do arquivo. Nunca edite uma migration já aplicada em produção —
crie uma nova.

### Roteiros e modo teleprompter (Prompt 6)

Continua tudo em `content_items` — não existe tabela "roteiros" própria. A
página Roteiros lista `researching`, `scripting` e `ready_to_record`
(`src/features/roteiros/roteiros-list.tsx`); o workspace
(`/roteiros/[id]`) edita tanto os campos de briefing que já existiam
(`objective`, `pillar`, `audience_intent`, `format`, `cta`,
`reference_text`/`url`) quanto os novos campos de roteiro:
`hook_variations` (até 5, jsonb array de strings — o gancho *escolhido*
continua em `hook`), `script_structure` (jsonb array de `{ content, note
}` — a posição no array é a própria ordem, sem campo `order` redundante;
rotulado como slides/cenas/telas conforme `format` só na UI, o dado é
igual para qualquer formato), `on_screen_text`, `shot_list` (jsonb array
de `{ type: "take" | "broll", description }`), `estimated_duration_seconds`
e `script_checklist` (objeto jsonb com as 6 chaves fixas de
`SCRIPT_CHECKLIST_KEYS` em `src/types/domain.ts` — diferente do checklist
diário do Check-in, este não é customizável).

Histórico básico de versões vive em `content_script_versions`, mesmo
padrão imutável de `content_status_history` (só policy de select/insert,
sem update/delete). O autosave (`saveScriptDraft`,
`src/lib/actions/script.ts`) só grava uma nova versão quando o conteúdo
mudou de verdade desde a última (`hasScriptSnapshotChanged`) e respeita um
throttle de 3 minutos (`shouldSkipAutoVersion`) para não encher o
histórico a cada pausa de digitação; o botão "Salvar rascunho"
(`saveScriptVersionNow`) ignora o throttle mas ainda evita duplicar uma
versão idêntica. "Restaurar esta versão" só copia o snapshot de volta para
o formulário — a própria restauração vira uma nova versão ao salvar,
nunca apaga histórico.

"Voltar etapa" e "Marcar como pronto para gravar" usam
`getPreviousContentStatus`/`moveScriptStatus` — sempre um `UPDATE` no
mesmo registro (nunca um novo `content_item`), com o histórico em
`content_status_history` gerado pelo trigger de sempre. O checklist de
roteiro (6 itens fixos) é só orientativo — não bloqueia marcar como
pronto para gravar.

O modo teleprompter (`/roteiros/[id]/teleprompter`, fora do fluxo normal
de navegação — tela cheia via `position: fixed` cobrindo o app inteiro,
não uma rota sem o AppShell) usa a Screen Wake Lock API com feature
detection (`"wakeLock" in navigator`) — sem suporte, simplesmente não
trava a tela, sem quebrar nada. A lógica de rolagem/limites de
fonte/velocidade é pura e testada sem DOM em `src/lib/teleprompter.ts`.

Geração de ganchos/roteiro por IA **não está integrada** — existe só o
contrato `ScriptAssistService` em `src/lib/services/script-assist.ts`,
sem nenhuma tela chamando-o (ver Pós-MVP).

### Gravação e Edição (Prompt 7)

Mesma filosofia de Roteiros: sem tabela "gravação" ou "edição" própria para
os dados do próprio conteúdo — tudo continua em `content_items`. A página
Gravação lista `ready_to_record`/`recorded`
(`src/features/gravacao/gravacao-workspace.tsx`, `src/lib/recording.ts`) em
três modos (lista, cards, sessão em lote); a página Edição lista
`recorded`/`editing`/`awaiting_approval`
(`src/features/edicao/edicao-list.tsx` + workspace completo em
`/edicao/[id]`, `src/lib/editing.ts`).

Campos de Edição reaproveitam colunas já existentes desde a Fase 1 em vez
de criar novas: `editing_notes` vira "instruções de edição",
`cover_notes` vira notas de capa, `recording_notes` (preenchido em
Roteiros) aparece como referência em Gravação, e `production_due_at` (já
usado por Hoje/alertas) vira o campo "prazo" de Edição — ver comentários na
migration `20260904150000_gravacao_edicao_fields.sql`. Novos: checklist de
gravação (`recording_checklist`, 8 chaves fixas) e checklist de qualidade
da edição (`edit_checklist`, 9 chaves fixas), ambos jsonb no mesmo padrão
de `script_checklist` — orientativos, não bloqueiam nenhuma ação. Arquivos
ficam só como link por enquanto (`raw_file_url`/`edited_file_url`):
Supabase Storage não está configurado neste projeto, então a interface de
upload (`src/lib/services/file-upload.ts`) existe só como contrato
desacoplado, sem nenhuma tela chamando-a (mesmo padrão do
`ScriptAssistService`).

Sessão de gravação em lote é a única estrutura nova de verdade: uma
`recording_sessions` (data, local, cenário, roupa, equipamento, tempo
disponível, observações) agrupa vários `content_items` via
`recording_session_items` (que só guarda a ordem de gravação —
`sort_order` — para reduzir trocas de cenário/roupa; o checklist de
gravação em si vive em `content_items.recording_checklist`, não na tabela
de sessão, para poder ser visto/marcado mesmo fora de uma sessão, nos
modos lista/cards). Reordenar arrasta com dnd-kit ou usa os botões
subir/descer (mesmo resultado — `reorderSessionItemIds` em
`src/lib/recording.ts` é a função pura que os dois caminhos chamam). Um
`content_item` não pode ser adicionado duas vezes à mesma sessão
(`unique (session_id, content_item_id)`), mas pode estar em sessões
diferentes. Excluir uma sessão remove seus `recording_session_items` em
cascata — o `content_item` em si nunca é afetado. Cronômetro é só estado
local da tela (não persiste — é uma ferramenta de apoio durante a
gravação, não um dado do pipeline).

Comentários/revisões de Edição vivem em `content_review_comments`, uma
linha por comentário, com `status` `open`/`resolved` — diferente de
`content_status_history`/`content_script_versions`, esta tabela **tem**
policy de `update` (permite reabrir um comentário já resolvido), porque
não é um histórico imutável.

"Iniciar edição"/"Enviar para aprovação"/"Aprovar" avançam
`recorded -> editing -> awaiting_approval -> scheduled`
(`getNextEditingStatus` em `src/lib/editing.ts`) — sempre um `UPDATE` no
mesmo `content_item`, histórico via trigger de sempre. "Marcar como
gravado" (Gravação) é o mesmo padrão para `ready_to_record -> recorded`.

### Agendamento, Publicados e Planejamento (Prompt 8)

Mesma filosofia das fases anteriores: nenhuma tabela nova para os dados do
próprio conteúdo. Agendamento (`/agendamento`, status `scheduled`) reaproveita
`content_items` para data/hora planejadas (`scheduled_at`), legenda final
(`caption`), CTA (`cta`), campanha/produto (`campaign_id`/`product_id`) e
capa (reaproveita `cover_notes`, já usado pela Edição) — só `hashtags`
(`text[]`) e `scheduling_checklist` (jsonb, 6 chaves fixas, mesmo padrão dos
checklists anteriores) são colunas novas de verdade (migration
`20260904160000_agendamento_publicados_planejamento.sql`). "Aprovados" e
"scheduled" são a mesma população: a ação "Aprovar" de Edição já avança
`awaiting_approval -> scheduled` (`getNextEditingStatus`), então Agendamento
trabalha só sobre esse status.

**Regra central, com defesa em duas camadas**: nunca marcar `published` sem
uma data/hora real. Reforçado por um CHECK constraint no banco
(`content_items_published_requires_published_at`: `status <> 'published' or
published_at is not null`) e por validação Zod no formulário do diálogo
"Marcar como publicado" (`markAsPublishedSchema`,
`src/lib/validations/agendamento.ts`). A URL do post é deliberadamente
opcional nesse momento — pode ser adicionada depois (`updatePublishedUrl`),
com alerta visível em Agendamento e Publicados enquanto faltar
(`isMissingPublishedUrl`).

Publicados (`/publicados`, status `published`/`repurpose`) calcula
pendências de captura de métricas em 24h/7d/30d comparando `published_at` +
a duração de cada janela contra agora, e conferindo se já existe um
`metric_snapshots` daquela janela (`getCapturePendencies`,
`src/lib/publicados.ts`) — sem nenhuma coluna nova para isso, é derivado.
"Duplicar como reaproveitamento" cria um `content_item` **novo** com
`source_content_id` apontando para o original e status `idea` (recomeça o
pipeline do zero) — o original nunca é alterado
(`repurposeContentItem`, `src/lib/data/content-items.ts`). O status
`repurpose` (pré-existente desde a Fase 1) continua sendo só uma flag manual
que um item publicado pode assumir; esta fase não criou UI para marcá-lo —
o fluxo implementado é o de duplicar, que é o que o Prompt 8 pediu.

Planejamento Semanal (`/planejamento/semana`) **reaproveita `weekly_reviews`**
em vez de criar uma tabela nova — a mesma constraint
`unique(user_id, week_start)` que a futura Revisão Semanal (Fase 7) usará
para `strategic_analysis`/`decision`/`completed_at` agora também guarda
`strategic_focus`, `weekly_experiment`, `priority_content_id`,
`active_campaign_id` e `planned_hours`. É a mesma linha por semana,
reaproveitada para dois propósitos (planejamento prospectivo aqui,
retrospectiva depois) — mesma filosofia de "um registro por
período/entidade" já usada em `content_items`. Estatísticas da semana
(planejados, publicados, % de execução, seguidores via `profile_snapshots`,
vendas/receita via `metric_snapshots` capturados na semana — uma
aproximação deliberada, não um livro-razão financeiro) são calculadas em
`src/lib/data/weekly-plan.ts`. "Horas" é sempre autorrelatado
(`planned_hours`), sem rastreamento automático de tempo.

Calendário (`/planejamento/calendario`) é a única tela desta fase com
tabela nova: `calendar_important_dates` (datas importantes editáveis, CRUD
completo, RLS padrão de 4 policies). Arrastar-e-soltar (dnd-kit,
`useDraggable`/`useDroppable`, não `useSortable` — os alvos são dias
diferentes, não uma lista reordenável) só é permitido para conteúdos com
status `scheduled` (`isDraggable`); `published_at` é um fato consumado e
nunca se reagenda por drag. Mover só troca a data, preservando a hora
planejada (`changeInstantDate`, `src/lib/dates.ts` — usa o mesmo offset fixo
`-03:00` do resto do produto) e é sempre um `UPDATE` no mesmo
`content_item` (`rescheduleContent`). Indicadores de dia vazio/excesso de
publicações e resumo do mês por formato/pilar são derivados
(`isEmptyDay`/`isExcessDay`/`summarizeMonth`, `src/lib/calendario.ts`), sem
nenhum dado pré-calculado guardado no banco.

Nenhuma integração real com a API do Instagram foi feita ou simulada — o
app só gerencia o agendamento e registra que algo foi publicado
manualmente. Uma integração real (ex.: publicação automática) é
explicitamente trabalho futuro (ver Pós-MVP em TODO.md).

### Métricas dos Conteúdos e índice de performance (Prompt 9)

Nenhuma tabela ou coluna nova nesta fase — `metric_snapshots` já tinha, desde
a Fase 2, exatamente as 22 entradas do Prompt 9 (views, alcance, impressões,
curtidas, comentários, compartilhamentos, salvamentos, respostas, visitas ao
perfil, seguidores gerados, cliques, leads, vendas, receita, tempo médio
assistido, duração, views de 3s, views completas, retenção informada, saídas
de stories, toques para avançar/voltar) e a constraint de uma leitura por
janela fixa por conteúdo (`metric_snapshots_content_fixed_window_key`, `where
window_type <> 'custom'`). Esta fase só implementou a UI e os cálculos.

Toda a lógica de cálculo mora em `src/lib/metricas.ts`, como funções puras
testadas (`src/lib/metricas.test.ts`, 60 casos) — nada de view SQL: a mesma
filosofia de "cálculo derivado em TypeScript, testável sem banco" já usada em
`content-pipeline.ts`/`publicados.ts`/`calendario.ts`. Regra central testada
explicitamente: **ausência de dado é `null`, nunca `0`**, inclusive em somas
(`sumAvailable` ignora os `null` em vez de somar como zero) e nenhuma divisão
produz `Infinity`/`NaN` — denominador ausente ou igual a zero sempre vira
`null` (`divide`). Os cálculos pedidos (engajamento total, taxas de
engajamento/curtidas/comentários/compartilhamentos/salvamentos, conversão em
seguidores, CTR, conversão clique→venda, RPM por 1.000 views, conclusão,
crescimento de views 24h→7d, retenção média, medição mais recente) são
funções individuais e independentes — a página de detalhe as mostra lado a
lado numa tabela por janela (24h/7d/30d/personalizada), não escondidas atrás
do índice.

**Índice de performance** (`computePerformanceIndex`/
`computePerformanceIndexForWindow`): 6 componentes (taxa de
compartilhamento, taxa de salvamento, taxa de engajamento, conversão em
seguidores, CTR, vendas por base), cada um comparado com uma média histórica
comparável (`buildPerformanceBaselines`) que tenta primeiro o mesmo
formato+conta (amostra mínima configurável, padrão 3), cai para a conta
inteira, depois para toda a base — nunca mistura leituras de janelas
diferentes na mesma base (comparar 24h com a média de 7d não faria sentido).
Cada componente é limitado a 3x a média antes de virar nota (100 = igual à
média), e o peso de um componente sem valor informado ou sem base histórica
suficiente é redistribuído proporcionalmente entre os disponíveis — nunca
vira zero silenciosamente. Pesos por componente mudam conforme
`content_items.objective` (`DEFAULT_OBJECTIVE_WEIGHTS`, 11 perfis + um
padrão, cada um somando exatamente 1.0, testado). Três estados possíveis:
`ok` (índice calculado), `no_capture` (sem leitura na janela escolhida) e
`insufficient_data` (há leitura, mas nenhum componente tem base histórica
comparável ainda) — os dois últimos são exibidos como texto explícito na UI,
nunca como um número enganoso.

Simplificação deliberada e documentada: a média histórica de um componente
inclui o próprio conteúdo sendo comparado (não exclui "a si mesmo"). Numa
base pequena como a deste produto isso muda pouco o resultado e evita
recalcular a base inteira por item — possível refinamento futuro, registrado
no TODO.md.

Faixas do índice (abaixo de 70/70–119/120–299/300+) são **configuráveis**
sem precisar de tabela nova: `getPerformanceIndexThresholds` lê
`app_settings.extra.performance_index_thresholds` quando presente e válido,
senão usa os padrões do Prompt 9 — mesmo padrão de jsonb livre já usado em
`weekly_reviews`/`content_items` para campos "orientativos". Esta fase não
criou uma tela de configuração para editá-las (só o modelo já é
configurável) — pendência registrada no TODO.md.

A "explicação visual" (não caixa-preta) é o `breakdown` que
`computePerformanceIndex` sempre devolve — componente a componente: valor
bruto, média usada (e com quem foi comparado: mesmo formato+conta, só
conta, ou global), razão (com aviso quando foi limitada a 3x), peso
original, peso redistribuído e quanto cada um contribuiu para a nota final
(`PerformanceIndexBreakdown`, `src/features/metricas/`).

Captura de métricas: um drawer só (`MetricCaptureDrawer`) com alternância
"Rápido"/"Completo" — os dois usam o mesmo formulário e o mesmo schema Zod
(`src/lib/validations/metric-snapshot.ts`); o modo rápido só esconde campos,
nunca desregistra: os valores de campos escondidos continuam no estado do
formulário e são enviados normalmente (testado explicitamente — trocar para
o modo rápido não apaga o que já estava preenchido no modo completo). Para
janelas fixas (24h/7d/30d) é sempre upsert (reaproveita
`recordMetricSnapshot`, já existente desde Publicados); para "custom", uma
nova captura é sempre um INSERT novo e editar uma captura "custom" existente
usa `updateMetricSnapshot` (novo em `src/lib/data/metric-snapshots.ts`) por
id, já que várias podem existir para o mesmo conteúdo. Validação acontece no
servidor (mesmo padrão de `MarkAsPublishedDialog`, Prompt 8) — o formulário
não usa `zodResolver` porque o schema tem transforms condicionais (janela
"custom" exige início/fim) que não batem exatamente com o tipo do
formulário (todos os campos string, obrigatórios) exigido por esse resolver.

Página `/metricas/conteudos`: tabela com filtros (busca, formato, pilar,
objetivo, conta, campanha, faixa do índice, só pendentes), seletor de janela
de comparação (24h/7d/30d) que recalcula índice e ranking juntos, ranking
visual (gráfico de barras, recharts) e alertas de pendência de
captura/índice sem base histórica no topo. Página de detalhe
`/metricas/conteudos/[id]`: comparação completa 24h/7d/30d/personalizada
(tabela de campos brutos + cálculos derivados lado a lado, mais um gráfico
de views), o índice com sua explicação visual, e a lista de capturas
personalizadas com editar/excluir.

### Métricas do Perfil e Metas (Prompt 10)

Uma migration nesta fase (`20260904170000_perfil_metas.sql`), estendendo
duas tabelas que já existiam desde a Fase 2 — nenhuma tabela nova:

- `profile_snapshots` ganhou 10 colunas opcionais (`views`,
  `accounts_engaged`, `interactions`, `messages`, `leads`, `sales`,
  `revenue`, `stories_count`, `hours_invested`, `notes`) e uma constraint
  `check` de não-negatividade cobrindo todas as métricas numéricas
  (antigas e novas).
- `goals` ganhou `period_end` (agora obrigatório — antes só existia
  `period_start`, o fim era implícito pelo `period_type`; migrado com um
  `update` que assume semana/mês civil para as linhas existentes) e
  `initial_value` (opcional). `metric` deixou de ser texto livre: uma
  constraint `check` agora restringe às 12 métricas do catálogo fechado
  (ver `GOAL_METRICS` em `src/lib/metas.ts`) — é isso que permite calcular
  o valor atual de qualquer meta cadastrada sem precisar interpretar texto
  arbitrário.

Toda a lógica de cálculo mora em dois arquivos novos, como funções puras
testadas — mesma filosofia de `metricas.ts`: nada é persistido, tudo é
recalculado ao vivo a partir dos dados brutos a cada leitura.

**`src/lib/perfil.ts`** (`perfil.test.ts`, 19 casos): seguidores ganhos e
crescimento % desde o registro anterior (mesma conta, ordenado por data);
variação (delta absoluto) de alcance/views/visitas/cliques; médias móveis
de 7 e 30 dias de qualquer campo numérico (média dos valores disponíveis
na janela, ignorando `null` — nunca conta `null` como zero); conteúdos
publicados na data *cruzado* com `content_items.published_at` (função
`contentPublishedOnDate`, uma contagem — `0` quando não há nada, nunca
`null`, diferente do resto dos cálculos: contagem ausente é `0`, dado
numérico ausente é `null`); receita acumulada no mês (soma `revenue` do
mês civil até a data); resultado por hora investida (`revenue` do próprio
dia dividido por `hours_invested` do próprio dia).

Decisão de escopo registrada no TODO.md: "conteúdos publicados" existe em
dois lugares com sentidos diferentes — `profile_snapshots.posts_count` é
autodeclarado (o que a pessoa digita), `contentPublishedOnDate` é o
cálculo cruzado com o pipeline real; a tabela de Perfil mostra os dois
lado a lado (a divergência entre eles é informação, não um bug a esconder).
"Resultado por hora investida" usa `revenue` como o "resultado" — decisão
deliberada por ser o campo mais concreto e diretamente monetário
disponível, documentada como pendência caso vire configurável no futuro.

**`src/lib/metas.ts`** (`metas.test.ts`, 35 casos): catálogo fechado de 12
métricas (`GOAL_METRICS`); `computeGoalCurrentValue` calcula o valor atual
de cada uma a partir da fonte certa — seguidores é a única métrica de
"estoque" (soma a leitura mais recente de cada conta até a data, nunca
soma leituras do mesmo dia como se fossem eventos); todo o resto é
"fluxo" (soma o período todo): views/alcance/visitas/cliques/leads/vendas/
receita vêm de `profile_snapshots`; compartilhamentos/salvamentos vêm de
`metric_snapshots` dos conteúdos publicados no período, usando sempre
`mostRecentSnapshot` de cada conteúdo (reaproveitado de `metricas.ts`) para
nunca contar a mesma leitura duas vezes entre janelas sobrepostas;
conteúdos publicados e consistência (dias distintos com publicação) são
contagens diretas de `content_items`. O valor calculado sempre considera só
até hoje (ou até o fim, se o período já passou) — uma meta em andamento não
é julgada pelo que ainda vai acontecer no resto do período.

`effectiveInitialValue`: o valor inicial informado pela usuária
(`goals.initial_value`) é opcional; quando ausente, métricas de fluxo
assumem `0` (fazem sentido partindo do zero dentro do período), mas
"seguidores" (a métrica de estoque) assume a última leitura de perfil
antes do início do período — uma meta de "chegar a 10 mil seguidores" não
deveria calcular progresso partindo de zero.

**Status da meta** (`computeGoalStatus`) sempre compara progresso (%) com
tempo decorrido (%) do período — nunca só o valor final, conforme pedido
explicitamente no Prompt 10. Ordem de verificação: `not_started` (hoje
antes do início, checado primeiro, incondicional) → `exceeded`/`achieved`
(progresso ≥150%/≥100%, checado antes de olhar o ritmo) → senão compara
`progresso / tempo_decorrido` ("pace ratio") contra um limite de risco
(padrão 0,7): ≥1 é `on_pace`, entre o limite e 1 é `in_progress`, abaixo do
limite é `at_risk`; um caso especial evita divisão por zero no primeiro dia
do período (`elapsedPercent` ainda em 0). A regra é exibida por extenso na
interface (`GOAL_STATUS_RULE_EXPLANATION`, mesma string usada no texto e no
cálculo — nunca podem dessincronizar) porque o Prompt 10 pediu
explicitamente que a regra fique visível, não só implementada. Os 6 status
usam os mesmos 6 tons de `StatusTone` já existentes (`toneClasses`) — dois
deles (`achieved`/`exceeded`) reaproveitam o tom `success`, diferenciados
só pelo ícone (mesmo padrão de reaproveitar tons entre vários status já
usado em `CONTENT_STATUS_META`).

`period_end >= period_start` calculado corretamente para metas iniciadas no
meio de uma semana/mês (`computeElapsedPercent` usa a duração real do
período, nunca assume semana/mês inteiro) — testado explicitamente com um
período de 8 dias começando no meio de uma semana civil, cobrindo os 4
status que dependem do tempo decorrido (`on_pace`/`in_progress`/`at_risk`/
`not_started`).

Limites do status (`atRiskBelowPaceRatio`/`achievedAtPercent`/
`exceededAtPercent`) e metas-padrão (valor-alvo sugerido por métrica) são
**configuráveis** sem tabela nova — `getGoalStatusThresholds`/
`getDefaultGoalTargets`/`withDefaultGoalTargets` leem/escrevem
`app_settings.extra.goal_status_thresholds`/`.default_goals`, mesmo padrão
de `performance_index_thresholds` (Prompt 9). "Permita configurações de
metas-padrão", pedido explicitamente no Prompt 10, foi interpretado como
só o valor-alvo sugerido (tela `DefaultGoalsDialog`, em Metas) — os
limites do status ficam configuráveis no modelo mas sem tela própria ainda
(pendência registrada no TODO.md, interpretação mais estreita e
deliberada).

Decisão de escopo (documentada e testada): metas não são filtradas por
conta do Instagram — seguidores, alcance, receita etc. são somados/
agregados entre todas as contas cadastradas da usuária. Mesma
simplificação já existente em `weekly-plan.ts` para o delta de seguidores
do Planejamento Semanal — optei por manter a mesma convenção em vez de
corrigir a inconsistência latente que ela já carregava.

Primeiro uso de uma barra de progresso no produto: `src/components/ui/
progress.tsx`, nativa (não Radix) — mesma filosofia de `select.tsx`.

Páginas: `/metricas/perfil` (gráficos de tendência + tabela de registros
com os derivados, drawer de registro/edição) e `/metas` (regra do status
sempre visível no topo, metas agrupadas semanais/mensais, diálogo de
criar/editar/excluir meta com sugestão automática de valor-alvo a partir
das metas-padrão, diálogo de configurar as metas-padrão).

### Campanhas, produtos, vendas e receita (Prompt 12)

`campaigns` e `products` foram evoluídas; não existe um segundo cadastro
concorrente. Campanhas guardam quatro status independentes (negociação,
contrato, entrega e pagamento), contato, tipo de parceria, conta, prazos,
cachê `numeric(14,2)`, links e arquivamento. Entregáveis e parcelas vivem em
tabelas relacionadas e têm RLS próprio.

Fonte de verdade de vendas: `sales_records.source = manual` guarda cliques,
leads, vendas e receita próprios; `source = metric_snapshot` guarda somente o
vínculo único com `metric_snapshots` e deriva os números dessa captura. O
índice parcial único em `metric_snapshot_id` impede dupla contagem da mesma
captura. `profile_snapshots` não entra no resumo financeiro atribuído porque
é um agregado diário sem vínculo e poderia repetir a mesma receita.

Receita total do domínio Negócio = recebimentos confirmados de campanhas +
receita atribuída a produtos. Cachê contratado, saldo e valor vencido são
derivados; nenhum total financeiro é persistido. Valores monetários usam
`numeric`, e ausência continua `null` (zero informado é preservado).

Rotas: `/negocio/campanhas`, `/negocio/campanhas/[id]`,
`/negocio/produtos` e `/negocio/receita`.

### Regras críticas de dados (não negociáveis)

- **Ausência de dado é `null`, nunca `0`.** Todo campo de métrica em
  `metric_snapshots` é opcional; o app nunca deve exibir "0" quando o dado
  simplesmente não foi lido ainda. Testado em
  `supabase/tests/migrations.test.ts` ("regra crítica: ausência de dado é
  null e não zero").
- **Exclusão de conteúdo usa `archived_at` por padrão** (soft delete).
  `deleteContentItemPermanently()` existe em `src/lib/data/content-items.ts`
  para hard delete administrativo, mas não é o caminho padrão da UI.
- **`content_items` é o registro central**: avançar de etapa é um
  `UPDATE` no campo `status` do mesmo registro (`updateContentItem()`),
  nunca um novo `INSERT`. Repurposing (`source_content_id`) é a única
  situação em que um novo registro é criado a partir de outro — porque ali
  o resultado é, de fato, um conteúdo novo, não uma etapa do mesmo.
- **Toda mudança de status gera histórico automaticamente** via trigger
  (não pela aplicação) — a aplicação nunca insere em
  `content_status_history` diretamente; o tipo `Insert`/`Update` dessa
  tabela em `src/types/database.ts` é deliberadamente `Record<string,
  never>` para impedir isso mesmo pelo client tipado.

### RLS: padrão usado em toda tabela

```sql
alter table public.<tabela> enable row level security;

create policy "<tabela>_select_own" on public.<tabela> for select
  using (user_id = auth.uid());
create policy "<tabela>_insert_own" on public.<tabela> for insert
  with check (user_id = auth.uid());
create policy "<tabela>_update_own" on public.<tabela> for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "<tabela>_delete_own" on public.<tabela> for delete
  using (user_id = auth.uid());
```

Duas tabelas fogem desse padrão de propósito:

- **`profiles`**: só tem policy de `select`/`update` próprios. Sem policy de
  `insert`/`delete` — a linha é criada exclusivamente pelo trigger
  `handle_new_user()` (`security definer`) e removida via `on delete
  cascade` quando o usuário é excluído em `auth.users`. Isso impede um
  usuário de criar um `profiles` para outro `id`.
- **`content_status_history`**: só tem policy de `select`/`insert` próprios.
  **Sem policy de `update`/`delete` nenhuma** — o Postgres nega por padrão
  qualquer comando sem policy correspondente, então o histórico é
  efetivamente imutável mesmo para o próprio dono. Confirmado por teste
  (`content_status_history é imutável mesmo para o próprio dono`).

**Revisão manual de vazamento entre usuários (Fase 2):** todas as 14
tabelas foram revisadas uma a uma confirmando (a) RLS habilitado, (b) toda
policy usando `auth.uid()` comparado à coluna de propriedade certa
(`user_id` na maioria; `account_id`/`content_item_id` não são usados como
filtro de posse sozinhos em nenhuma tabela — sempre há uma coluna
`user_id` própria da linha). Nenhuma policy usa `true` (aberta) ou concede
acesso baseado em dado que o próprio usuário controla de forma insegura.
Além da revisão manual, `supabase/tests/migrations.test.ts` prova isso de
forma empírica: cria duas usuárias reais (via o shim de `auth.users`),
alterna entre elas com `SET ROLE authenticated` + JWT claim simulado, e
verifica que SELECT/INSERT/UPDATE/DELETE de uma usuária nunca afeta ou
retorna linhas da outra.

### Camada de acesso a dados (`src/lib/data/`)

Um arquivo por tabela/domínio (`content-items.ts`, `metric-snapshots.ts`,
etc.), todos seguindo o mesmo padrão:

- Toda função recebe um `DbClient` (tipo em `src/lib/data/types.ts`) como
  primeiro argumento — nunca importa um client global. Isso permite chamar
  a mesma função a partir de um Server Component (`createClient()` de
  `src/lib/supabase/server.ts`) ou de um Client Component/hook
  (`src/lib/supabase/client.ts`).
- Toda função lança `DataAccessError` (`src/lib/data/errors.ts`) em vez de
  retornar `{ data, error }` — funciona tanto com `try/catch` quanto como
  `queryFn` do TanStack Query.
- **Nenhum componente deve chamar `supabase.from(...)` diretamente.** Se a
  função que você precisa não existir ainda em `src/lib/data/`, crie-a lá,
  não inline no componente.

### Autenticação

- `src/lib/auth/actions.ts` — Server Actions (`"use server"`):
  `signInWithPassword`, `signUpWithPassword`, `signOut`. É o único lugar que
  chama `supabase.auth.*` para login/cadastro/logout.
- `middleware.ts` + `src/lib/supabase/middleware.ts` — protege por padrão
  qualquer rota fora de `PUBLIC_PATHS` (`/`, `/login`, `/auth/callback`,
  `/auth/auth-code-error`, `/offline`), usando `supabase.auth.getUser()`
  (validado no servidor — nunca `getSession()` para decidir acesso). Testado
  em `src/lib/supabase/middleware.test.ts` (Prompt 14, cenário obrigatório
  #1: sessão ausente em rota protegida → redireciona para `/login?proximo=`;
  rota pública → passa; sessão válida → passa; sessão válida em `/login` →
  redireciona para `/hoje`).
- `/login` — tela de login/cadastro. Após login bem-sucedido, redireciona
  para `?proximo=` (a rota que o middleware guardou antes de mandar para o
  login) quando presente e segura (`src/lib/safe-redirect.ts` — só aceita
  caminho interno relativo, nunca URL absoluta ou `//host`, para evitar open
  redirect), senão para `/hoje`. O mesmo helper é usado por
  `src/app/auth/callback/route.ts` (fluxo OAuth/magic-link).
- `/sessao` — página de diagnóstico (não faz parte do fluxo de produto):
  confirma que login → middleware → leitura de dados funcionam de ponta a
  ponta. Não é mais o destino do redirect pós-login (corrigido no Prompt 14
  — antes mandava toda usuária real para essa página de debug em vez de
  `/hoje`).

### Rodando os testes de migration/RLS localmente

`supabase/tests/migrations.test.ts` usa `@electric-sql/pglite` (Postgres
real compilado para WASM) para aplicar todas as migrations e rodar
asserções reais de SQL/RLS sem precisar de Docker nem de um projeto
Supabase de verdade. Roda junto com `npm run test`. Se você adicionar uma
migration nova, rode `npm run test` para confirmar que ela aplica sem erro
e que RLS continua isolando usuários corretamente.

### Como criar o projeto Supabase e aplicar as migrations

1. Crie um projeto em [supabase.com](https://supabase.com) (ou rode
   Supabase localmente com `npx supabase start`, se preferir).
2. Copie a **Project URL** e a **anon public key** (Project Settings → API)
   para o seu `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Aplique as migrations, por qualquer um destes caminhos:
   - **Supabase CLI** (recomendado): `npx supabase login`, depois
     `npx supabase link --project-ref <ref-do-projeto>`, depois
     `npx supabase db push` — aplica todos os arquivos de
     `supabase/migrations/` em ordem.
   - **SQL Editor do painel do Supabase**: cole o conteúdo de cada arquivo
     de `supabase/migrations/`, em ordem (pelo nome/timestamp), e rode um
     de cada vez.
4. **Nunca aplique `supabase/seed.sql` em produção.** Ele é só para
   desenvolvimento local: cadastre-se pelo app de verdade primeiro
   (`/login` → "Criar conta"), pegue o UUID do seu usuário em
   `auth.users`, substitua o placeholder no topo do arquivo e rode-o
   manualmente (`psql "$DATABASE_URL" -f supabase/seed.sql` ou colando no
   SQL Editor). O arquivo se recusa a rodar (lança exceção) se você
   esquecer de substituir o placeholder.
5. Gere/confira os tipos TypeScript quando quiser conferir
   `src/types/database.ts` contra o schema real:
   `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`
   (depois confira manualmente se `Insert`/`Update` de
   `content_status_history` continuam bloqueados — o gerador oficial não
   sabe que essa tabela é só-trigger).

## Auditoria, PWA e produção (Prompt 14)

Fase de estabilização: nenhuma tela nova, foco em corrigir o que estava
incompleto e preparar para produção. Resumo do que mudou (ver `TODO.md`
para o relatório completo da fase):

- **Schema real x código**: a migration do Prompt 12 (`campanhas_receita`)
  nunca tinha sido aplicada no projeto Supabase real — aplicada nesta fase.
  Confirme sempre com `mcp__Supabase__list_tables` / `list_migrations` (ou
  `npx supabase migration list` via CLI) que o projeto real tem todas as
  migrations de `supabase/migrations/`, já que o pglite dos testes locais
  não garante isso.
- **Performance de RLS**: todas as policies pré-Prompt-12 usavam
  `auth.uid()` cru (reavaliado por linha); reescritas para
  `(select auth.uid())` (avaliado uma vez por query) — mudança de
  performance pura, sem alteração de semântica de autorização.
- **Segurança corrigida**: open redirect no `?proximo=`/`?next=` de login e
  callback (`src/lib/safe-redirect.ts`); injeção de fórmula em export CSV
  (`escapeCsvFormula` em `src/lib/backup.ts` — prefixa `'` em valores que
  começam com `= + - @`); validação Zod ausente em `saveSettingsAction` e
  na criação de conta do Instagram (`src/lib/validations/configuracoes.ts`,
  `src/lib/validations/instagram-accounts.ts`); URLs de campanha
  (`briefingUrl`/`contractUrl`/`folderUrl`/`publicationUrl`) validadas como
  URL, não texto livre.
- **Regra "ausência ≠ zero"**: `weekly_publish_target` em branco agora vira
  `null`, não `0`.
- **Fuso horário**: `src/lib/dates.ts` ganhou `formatDateBR`/
  `formatDateTimeBR` (sempre `America/Sao_Paulo`); todo `.toLocaleDateString`/
  `.toLocaleString` disperso pelas telas que não passava `timeZone` foi
  substituído por esses helpers (10 arquivos).
- **Fluxo de login corrigido**: pós-login mandava toda usuária para
  `/sessao` (página de diagnóstico) em vez de `/hoje` — ver "Autenticação"
  acima.
- **PWA** (app instalável, sem biblioteca de terceiros): `public/
  manifest.webmanifest`, ícones em `public/icons/` (192/512/512-maskable/
  apple-touch), `public/sw.js` (service worker escrito à mão — cache só de
  assets estáticos e do shell da rota, nunca de respostas autenticadas ou
  dados pessoais; atualização controlada via mensagem `SKIP_WAITING`
  disparada pelo usuário, nunca automática), `src/providers/pwa-provider.tsx`
  (registra o service worker, mostra banner de "nova versão disponível" e
  banner de offline), `src/app/offline/page.tsx` (fallback honesto: avisa
  que o dispositivo está sem conexão e que **nenhuma escrita é salva** —
  não existe fila de mutação offline, porque isso exigiria idempotência e
  resolução de conflito que o app não implementa; a escrita é bloqueada com
  mensagem clara em vez de fingir que vai sincronizar depois).
- **a11y**: `prefers-reduced-motion: reduce` respeitado globalmente em
  `src/app/globals.css` (reduz duração de transições/animações a ~0 para
  quem pede menos movimento no sistema operacional).
- **Auditoria visual**: telas públicas (`/`, `/login`, `/offline`)
  verificadas via screenshot real (Playwright/Chromium) em 375/768/1440px —
  sem defeitos visuais nas 9 combinações. Telas autenticadas não foram
  verificadas visualmente nesta fase (exigiria criar uma usuária de teste
  descartável no projeto Supabase real, decisão que ficou em aberto —
  ver `TODO.md`).
- **Cobertura de teste dos 12 cenários obrigatórios do Prompt 14**: 11 já
  cobertos pelos testes existentes (pipeline, check-in, roteiro→agendamento→
  publicado, métricas sem zero-falso, metas, revisão semanal, campanha com
  pagamento parcial, importação com prevenção de duplicidade, export de
  backup, isolamento entre usuárias via `supabase/tests/migrations.test.ts`
  com pglite). O único que faltava — login + proteção de rota — ganhou
  `src/lib/supabase/middleware.test.ts` nesta fase.

## Comandos

```bash
npm run dev          # servidor de desenvolvimento (Turbopack)
npm run build         # build de produção
npm run start          # servir o build de produção
npm run lint            # ESLint
npm run typecheck        # tsc --noEmit
npm run test               # Vitest (roda uma vez)
npm run test:watch          # Vitest em modo watch
npm run test:coverage        # Vitest com cobertura (v8)
npm run test:e2e               # Playwright (precisa de `npx playwright install`
                                 # antes — bloqueado no sandbox do Claude Code,
                                 # ver TODO.md)
```

## Critérios de conclusão (para qualquer fase/funcionalidade)

Antes de considerar uma fase concluída:

1. `npm run lint` sem erros.
2. `npm run typecheck` sem erros.
3. `npm run test` sem falhas (testes novos cobrindo o que foi implementado).
4. `npm run build` completa com sucesso.
5. Nenhum dado mockado exibido como se fosse real (fora da fase de fundação).
6. Nenhuma credencial/segredo hardcoded — tudo via variáveis de ambiente
   documentadas em `.env.example`.
7. Textos visíveis ao usuário em português do Brasil.
8. `TODO.md` atualizado (itens da fase marcados, novas pendências
   registradas).

## Ambiente de desenvolvimento (nota operacional)

Este projeto foi criado via Claude Code rodando num ambiente sandboxed com
acesso de rede restrito por allowlist. Domínios confirmados **bloqueados**
nesse sandbox: `ui.shadcn.com`, `fonts.googleapis.com`,
`cdn.playwright.dev`. O registro do npm (`registry.npmjs.org`) funciona
normalmente. Fora do sandbox (máquina da Cami, CI, Vercel), essas
restrições provavelmente não existem — mas não assuma isso sem testar.

Além disso, quando o Claude Code acessa esta pasta através da ponte com o
computador (não é o caso quando você mesma abre a pasta no Windows), o I/O
de arquivo é **muito mais lento** que o disco nativo do ambiente Linux do
agente — operações com muitos arquivos pequenos (como `npm install`, que
grava milhares de arquivos) podem levar minutos ali contra segundos em
disco nativo. Por isso, o Claude Code roda `npm install`/build/test num
diretório espelho rápido fora da pasta sincronizada, e só sincroniza de
volta os arquivos de código/config — **nunca `node_modules`** (nem como
pasta real, nem como link simbólico: o Turbopack do Next.js recusa rodar
quando `node_modules` é um link apontando para fora da raiz do projeto).

Isso é só uma otimização do agente para esta sessão — **não afeta você
trabalhando diretamente no Windows**. Ao abrir este projeto localmente,
`node_modules` simplesmente não existe ainda (como um clone recém-baixado)
— rode `npm install` normalmente no seu terminal.
