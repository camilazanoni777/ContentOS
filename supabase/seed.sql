-- =============================================================================
-- SEED DE DESENVOLVIMENTO — NUNCA aplicar em produção.
--
-- Este arquivo NÃO é aplicado automaticamente pelo Supabase (nem local, nem
-- remoto). Ele existe apenas para popular dados de teste manualmente durante
-- o desenvolvimento, via `psql` ou o SQL editor do Supabase, depois de você
-- já ter criado um usuário de verdade pelo fluxo normal de cadastro do app
-- (tela de login -> "Criar conta"). Não fabricamos linhas em auth.users aqui
-- porque isso é gerenciado pelo Supabase Auth (senha, hashes etc.).
--
-- Como usar:
--   1. Cadastre um usuário pelo app (tela /login).
--   2. Descubra o UUID dele: select id from auth.users where email = '...';
--   3. Substitua o valor de dev_user_id abaixo por esse UUID.
--   4. Rode este arquivo (psql "$DATABASE_URL" -f supabase/seed.sql, ou cole
--      no SQL editor do Supabase).
-- =============================================================================

do $$
declare
  dev_user_id uuid := '00000000-0000-0000-0000-000000000000';
  v_account_id uuid;
  v_series_id uuid;
  v_campaign_id uuid;
  v_product_id uuid;
  v_content_a uuid;
  v_content_b uuid;
  v_content_c uuid;
  v_metric_id uuid;
begin
  if dev_user_id = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Substitua dev_user_id pelo UUID de um usuário real antes de rodar o seed (veja instruções no topo do arquivo).';
  end if;

  if not exists (select 1 from auth.users where id = dev_user_id) then
    raise exception 'Nenhum usuário com id % encontrado em auth.users. Cadastre-se pelo app primeiro.', dev_user_id;
  end if;

  update public.app_settings
  set
    pillars = array['Bastidores', 'Educacional', 'Storytelling', 'Vendas'],
    formats = array['Reels', 'Carrossel', 'Stories', 'Live'],
    objectives = array['Alcance', 'Engajamento', 'Vendas', 'Autoridade'],
    ctas = array['Comente', 'Salve', 'Compartilhe', 'Link na bio'],
    weekly_publish_target = 5
  where user_id = dev_user_id;

  insert into public.instagram_accounts (user_id, handle, display_name, is_primary, connected_at)
  values (dev_user_id, 'cami.exemplo', 'Cami (conta principal)', true, now())
  returning id into v_account_id;

  insert into public.content_series (user_id, name, description)
  values (dev_user_id, '5 erros de posicionamento', 'Série educacional sobre erros comuns de posicionamento no Instagram.')
  returning id into v_series_id;

  insert into public.campaigns (user_id, name, brand_name, notes, campaign_type, account_id, negotiation_status, contract_status, delivery_status, payment_status, contracted_fee, delivery_due_date)
  values (dev_user_id, 'Campanha fictícia de setembro', 'Marca Exemplo (fictícia)', 'Dados exclusivamente de desenvolvimento.', 'paid_post', v_account_id, 'approved', 'signed', 'in_production', 'partially_paid', 2000.00, current_date + 30)
  returning id into v_campaign_id;

  insert into public.products (user_id, name, notes, reference_price, status)
  values (dev_user_id, 'Produto de exemplo', 'Produto fictício para desenvolvimento.', 1200.00, 'active')
  returning id into v_product_id;

  insert into public.campaign_deliverables (user_id, campaign_id, title, quantity, due_date)
  values (dev_user_id, v_campaign_id, 'Reel patrocinado fictício', 1, current_date + 20);

  insert into public.campaign_payments (user_id, campaign_id, amount, received_amount, received_at, due_date, status, notes)
  values (dev_user_id, v_campaign_id, 1000.00, 1000.00, now(), current_date, 'paid', 'Primeira parcela fictícia.');

  insert into public.content_items (user_id, account_id, title, hook, pillar, format, objective, status, series_id, campaign_id)
  values (
    dev_user_id, v_account_id,
    'Ideia: bastidores da gravação',
    'Ninguém te conta isso sobre criar conteúdo...',
    'Bastidores', 'Reels', 'Engajamento', 'idea', v_series_id, v_campaign_id
  )
  returning id into v_content_a;

  insert into public.content_items (user_id, account_id, title, hook, script, pillar, format, objective, status, campaign_id)
  values (
    dev_user_id, v_account_id,
    'Roteiro: 3 erros de posicionamento',
    'Se você comete esse erro, seu conteúdo não converte.',
    'Roteiro em construção...',
    'Educacional', 'Carrossel', 'Autoridade', 'scripting', v_campaign_id
  )
  returning id into v_content_b;

  insert into public.content_items (
    user_id, account_id, title, hook, caption, pillar, format, objective, status,
    published_at, published_url, product_id
  )
  values (
    dev_user_id, v_account_id,
    'Publicado: como vender sem parecer vendedor',
    'A forma certa de vender no Instagram.',
    'Legenda completa do post publicado. #vendas #instagram',
    'Vendas', 'Reels', 'Vendas', 'published',
    now() - interval '5 days', 'https://instagram.com/p/exemplo123', v_product_id
  )
  returning id into v_content_c;

  insert into public.metric_snapshots (content_item_id, user_id, window_type, views, likes, comments, shares, saves)
  values (v_content_c, dev_user_id, '24h', 4200, 310, 28, 12, 45);

  insert into public.metric_snapshots (content_item_id, user_id, window_type, views, likes, comments, shares, saves, followers_gained, link_clicks, leads, sales, revenue)
  values (v_content_c, dev_user_id, '7d', 9800, 720, 61, 30, 110, 24, 120, 18, 3, 3600.00)
  returning id into v_metric_id;

  insert into public.sales_records (user_id, product_id, content_item_id, metric_snapshot_id, source, sale_date, notes)
  values (dev_user_id, v_product_id, v_content_c, v_metric_id, 'metric_snapshot', current_date - 5, 'Atribuição fictícia derivada da captura de 7 dias.');

  insert into public.profile_snapshots (account_id, user_id, snapshot_date, followers, following, posts_count)
  values (v_account_id, dev_user_id, current_date, 15200, 340, 128);

  insert into public.daily_checkins (user_id, checkin_date, morning_mood, morning_focus, evening_summary)
  values (dev_user_id, current_date, 'Motivada', 'Gravar 2 reels', 'Consegui gravar 1 de 2, mas roteirizei o resto da semana.');

  insert into public.goals (user_id, period_type, period_start, metric, target_value)
  values (dev_user_id, 'weekly', date_trunc('week', current_date)::date, 'Publicações na semana', 5);

  raise notice 'Seed de desenvolvimento aplicado com sucesso para o usuário %.', dev_user_id;
end $$;
