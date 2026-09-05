# Analisar — Métricas dos Conteúdos (Prompt 9)

Implementado nesta fase: **Métricas dos Conteúdos** (`/metricas/conteudos`)
e os cálculos derivados. `/metricas/perfil` continua placeholder — fora do
escopo do Prompt 9 (fica para a parte de "métricas do perfil" da Fase 7).

## Arquivos

- `metricas-workspace.tsx` — tela de listagem: tabela com filtros
  (busca/formato/pilar/objetivo/conta/campanha/faixa do índice/pendências),
  seletor de janela de comparação (24h/7d/30d), ranking visual e alertas de
  pendência de captura / índice sem base histórica.
- `metricas-detail.tsx` — tela de detalhe de um conteúdo: comparação
  completa entre janelas (campos brutos + cálculos derivados lado a lado),
  gráfico de views, índice de performance com sua explicação visual, e a
  lista de capturas personalizadas (editar/excluir).
- `metric-capture-drawer.tsx` — drawer de captura com alternância
  Rápido/Completo (mesmo formulário e schema; o modo rápido só esconde
  campos, nunca perde o que já estava preenchido).
- `metric-snapshot-form-types.ts` — tipos do formulário (todos os campos
  como string — padrão do projeto) e conversão de/para `MetricSnapshot`.
- `performance-index-breakdown.tsx` — badge do índice (número + faixa) e a
  explicação visual componente a componente (nunca uma caixa-preta).
- `metricas-charts.tsx` — gráficos (recharts): comparação de views entre
  janelas, e ranking por índice de performance.

A lógica de cálculo em si (todas as fórmulas, o índice de performance e a
base histórica comparável) mora em `src/lib/metricas.ts`, como funções
puras testadas — nada de view SQL. Ver a seção "Métricas dos Conteúdos e
índice de performance (Prompt 9)" em `CLAUDE.md` para os detalhes de
arquitetura (pesos por objetivo, redistribuição, faixas configuráveis,
estados sem captura/sem base histórica).
