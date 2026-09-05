# Analisar — Métricas do Perfil (Prompt 10)

Implementado nesta fase: **Métricas do Perfil** (`/metricas/perfil`) — um
registro por conta por dia, com os cálculos derivados sempre recalculados
ao vivo, nunca persistidos.

## Arquivos

- `perfil-workspace.tsx` — tela principal: gráficos de tendência
  (seguidores + média móvel de 7d; alcance e views) e a tabela de
  registros, cada linha já com os derivados calculados (ganhos, crescimento
  %, variações, conteúdos publicados cruzado com o pipeline, receita
  acumulada do mês, resultado por hora).
- `profile-snapshot-drawer.tsx` — drawer de registro/edição. Um registro
  por conta por dia (upsert na mesma chave) — reabrir a mesma conta+data
  edita o que já existe.
- `profile-snapshot-form-types.ts` — tipos do formulário (todos os campos
  como string, mesmo padrão de `MetricSnapshotFormValues`) e conversão
  de/para `ProfileSnapshot`.
- `perfil-charts.tsx` — gráficos (recharts) de seguidores (com média móvel
  de 7d sobreposta) e de alcance/views.

A lógica de cálculo (ganhos de seguidores, crescimento %, variações,
médias móveis de 7/30 dias, cruzamento com conteúdos publicados, receita
acumulada do mês, resultado por hora) mora em `src/lib/perfil.ts`, como
funções puras testadas em `src/lib/perfil.test.ts`. Ver a seção "Métricas
do Perfil e Metas (Prompt 10)" em `CLAUDE.md` para os detalhes de
arquitetura e decisões de escopo.
