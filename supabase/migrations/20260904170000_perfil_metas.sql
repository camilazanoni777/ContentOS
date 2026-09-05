-- Prompt 10: Métricas do Perfil (novos campos brutos) e Metas (período
-- explícito + valor inicial + catálogo fechado de métricas).

-- profile_snapshots: campos opcionais adicionais do registro diário de
-- perfil. Métricas ausentes continuam null — nunca 0.
alter table public.profile_snapshots
  add column views bigint,
  add column accounts_engaged bigint,
  add column interactions bigint,
  add column messages bigint,
  add column leads bigint,
  add column sales bigint,
  add column revenue numeric(14, 2),
  add column stories_count bigint,
  add column hours_invested numeric(6, 2),
  add column notes text;

alter table public.profile_snapshots
  add constraint profile_snapshots_non_negative check (
    (followers is null or followers >= 0) and
    (following is null or following >= 0) and
    (posts_count is null or posts_count >= 0) and
    (profile_visits is null or profile_visits >= 0) and
    (reach is null or reach >= 0) and
    (impressions is null or impressions >= 0) and
    (website_clicks is null or website_clicks >= 0) and
    (views is null or views >= 0) and
    (accounts_engaged is null or accounts_engaged >= 0) and
    (interactions is null or interactions >= 0) and
    (messages is null or messages >= 0) and
    (leads is null or leads >= 0) and
    (sales is null or sales >= 0) and
    (revenue is null or revenue >= 0) and
    (stories_count is null or stories_count >= 0) and
    (hours_invested is null or hours_invested >= 0)
  );

comment on column public.profile_snapshots.views is 'Views do perfil/conteúdos no dia (autodeclarado).';
comment on column public.profile_snapshots.accounts_engaged is 'Contas engajadas no dia.';
comment on column public.profile_snapshots.interactions is 'Interações totais no dia (curtidas + comentários + compartilhamentos + salvamentos, como o Instagram reporta).';
comment on column public.profile_snapshots.messages is 'Mensagens diretas recebidas no dia.';
comment on column public.profile_snapshots.leads is 'Leads gerados no dia.';
comment on column public.profile_snapshots.sales is 'Vendas fechadas no dia.';
comment on column public.profile_snapshots.revenue is 'Receita do dia (R$).';
comment on column public.profile_snapshots.stories_count is 'Stories publicados no dia (autodeclarado — ver também conteúdos publicados, cruzado com content_items em src/lib/perfil.ts).';
comment on column public.profile_snapshots.hours_invested is 'Horas investidas no dia — usado para o cálculo de "resultado por hora investida".';
comment on column public.profile_snapshots.notes is 'Observações livres do dia.';

comment on table public.profile_snapshots is
  'Leituras periódicas do perfil do Instagram, uma por conta por dia. Métricas ausentes são null. "posts_count" e "stories_count" são autodeclarados; o cruzamento com content_items (conteúdos realmente publicados no pipeline nesse dia) é feito em src/lib/perfil.ts, não armazenado.';

-- goals: fim do período explícito, valor inicial opcional, e catálogo
-- fechado de métricas (as 12 do Prompt 10) — antes `metric` era texto
-- totalmente livre, agora é restrito para as telas de Metas saberem
-- calcular o valor atual de qualquer meta cadastrada (ver src/lib/metas.ts).
alter table public.goals
  add column period_end date,
  add column initial_value numeric(14, 2);

update public.goals
set period_end = case
  when period_type = 'weekly' then period_start + interval '6 days'
  else (date_trunc('month', period_start) + interval '1 month - 1 day')::date
end
where period_end is null;

alter table public.goals
  alter column period_end set not null;

alter table public.goals
  add constraint goals_period_end_after_start check (period_end >= period_start);

alter table public.goals
  add constraint goals_metric_known check (
    metric in (
      'seguidores', 'conteudos_publicados', 'views', 'alcance', 'compartilhamentos',
      'salvamentos', 'visitas_perfil', 'cliques', 'leads', 'vendas', 'receita', 'consistencia'
    )
  );

comment on column public.goals.period_end is 'Fim do período da meta (inclusive). Metas iniciadas no meio de uma semana/mês têm período_end e período_start explícitos, não inferidos.';
comment on column public.goals.initial_value is 'Valor no início do período, opcional. Quando ausente: métricas de fluxo (views, receita etc.) assumem 0; "seguidores" (a única métrica de estoque) assume a última leitura de perfil antes do início — ver effectiveInitialValue em src/lib/metas.ts.';
comment on column public.goals.metric is 'Uma das 12 métricas do catálogo fechado (ver GOAL_METRICS em src/lib/metas.ts) — restrito por constraint para a tela de Metas saber calcular o valor atual de qualquer meta.';

comment on table public.goals is
  'Metas semanais/mensais. Regra crítica: valores ausentes são null, nunca zero. achieved_value nunca é escrito pelo app — o valor atual é sempre recalculado ao vivo (ver computeGoal em src/lib/metas.ts), não persistido.';
