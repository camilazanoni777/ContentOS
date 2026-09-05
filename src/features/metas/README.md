# Planejar — Metas (Prompt 10)

Implementado nesta fase: **Metas** (`/metas`) — metas semanais/mensais
com progresso e status sempre recalculados ao vivo a partir de Métricas do
Perfil, conteúdos publicados e leituras de métricas — nunca digitados à
mão nem persistidos (o campo `goals.achieved_value` do banco existe desde
a Fase 7 mas fica deliberadamente sem uso nesta fase).

## Arquivos

- `metas-workspace.tsx` — tela principal: explicação da regra de status
  sempre visível, metas agrupadas em semanais/mensais, botões de nova meta
  e de metas-padrão.
- `goal-card.tsx` — cartão de uma meta: status (texto + cor + ícone),
  barra de progresso, atual/alvo/falta/tempo decorrido/dias restantes.
- `goal-status-meta.ts` — ícone + tom de cor de cada um dos 6 status
  (mesma convenção de `content-status-meta.tsx`: nunca cor sozinha).
- `goal-form-dialog.tsx` — diálogo de criar/editar/excluir uma meta —
  início/fim explícitos (period_end é um campo real, não inferido), valor
  inicial opcional, e sugestão automática de valor-alvo a partir das
  metas-padrão ao trocar de métrica (só quando o campo ainda está vazio).
- `default-goals-dialog.tsx` — configuração das metas-padrão (valor-alvo
  sugerido por métrica, por tipo de período) — guardadas em
  `app_settings.extra.default_goals`, mesmo padrão de
  `performance_index_thresholds` (Prompt 9): configurável sem tabela nova.

A lógica de cálculo (catálogo das 12 métricas, valor atual de cada uma,
progresso, status, limites configuráveis) mora em `src/lib/metas.ts`, como
funções puras testadas em `src/lib/metas.test.ts`. Ver a seção "Métricas do
Perfil e Metas (Prompt 10)" em `CLAUDE.md` para os detalhes de arquitetura
e decisões de escopo (agregação entre contas, "conteúdos publicados"
autodeclarado vs. cruzado, etc.).
