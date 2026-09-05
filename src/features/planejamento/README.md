# Planejar

Duas telas, ambas em `content_items` + `weekly_reviews` + `calendar_important_dates`
como fontes de dados (nenhuma tabela nova para a grade semanal — ver decisão de
reaproveitamento abaixo):

## Semana (`/planejamento/semana`)

Plano da semana (segunda a domingo) salvo como upsert em `weekly_reviews` (mesma
constraint `unique(user_id, week_start)` que a futura Revisão Semanal, Fase 7, usa para
`strategic_analysis`/`decision`/`completed_at` — **é a mesma linha por semana**,
reaproveitada para dois propósitos diferentes: planejamento prospectivo aqui, retrospectiva
depois). Campos novos desta fase: `strategic_focus`, `weekly_experiment`,
`priority_content_id`, `active_campaign_id`, `planned_hours` (ver migration
`20260904160000`). Estatísticas (planejados, publicados, % de execução, seguidores,
vendas, receita) são calculadas em `src/lib/data/weekly-plan.ts`
(`getWeeklyPlanStats`), reaproveitando `profile_snapshots` (delta de seguidores) e
`metric_snapshots` (vendas/receita capturadas na semana — uma aproximação deliberada,
não um livro-razão financeiro). "Horas" é sempre autorrelatado (`planned_hours`), sem
integração de rastreamento de tempo. Grade diária via `buildWeeklyDailyGrid`
(`src/lib/planejamento-semanal.ts`).

## Calendário (`/planejamento/calendario`)

Grade mensal (semanas completas, incluindo dias de meses vizinhos) com arrastar-e-soltar
(dnd-kit) para reagendar — só conteúdos com status `scheduled` podem ser arrastados
(`isDraggable`); `published_at` é um fato consumado e não se reagenda por drag. O
reagendamento troca só a data, preservando o horário planejado
(`changeInstantDate`, `src/lib/dates.ts`) e é persistido sempre como um UPDATE no mesmo
`content_item` (`rescheduleContent`). Filtros por formato/pilar/objetivo/status/campanha,
indicadores de dia vazio e de excesso de publicações (`CALENDAR_EXCESS_THRESHOLD`),
resumo do mês por formato/pilar (`summarizeMonth`) e datas importantes editáveis
(`calendar_important_dates`, tabela nova desta fase — CRUD completo com RLS).

Não simula publicação automática no Instagram — o app gerencia só o agendamento.
