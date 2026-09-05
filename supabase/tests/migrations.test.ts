// @vitest-environment node
//
// Testes de integração das migrations SQL usando @electric-sql/pglite (um
// Postgres real compilado para WASM). Isso permite validar de forma empírica
// que o schema, os triggers e — principalmente — as policies de RLS
// funcionam como esperado, sem depender de Docker/psql nem de um projeto
// Supabase real.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");
const AUTH_SHIM_PATH = path.resolve(__dirname, "./auth-shim.sql");

let db: PGlite;

async function actAsAdmin() {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
}

async function actAsUser(userId: string) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`
  );
}

async function createAuthUser(email: string): Promise<string> {
  await actAsAdmin();
  const result = await db.query<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id;`,
    [email]
  );
  return result.rows[0].id;
}

beforeAll(async () => {
  db = new PGlite();

  await db.exec(readFileSync(AUTH_SHIM_PATH, "utf-8"));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    try {
      await db.exec(sql);
    } catch (err) {
      throw new Error(`Falha ao aplicar migration ${file}: ${(err as Error).message}`);
    }
  }
});

afterAll(async () => {
  await db.close();
});

describe("migrations", () => {
  const expectedTables = [
    "profiles",
    "instagram_accounts",
    "content_items",
    "content_status_history",
    "content_series",
    "daily_checkins",
    "daily_actions",
    "checklist_items",
    "metric_snapshots",
    "profile_snapshots",
    "goals",
    "weekly_reviews",
    "campaigns",
    "products",
    "app_settings",
    "content_script_versions",
    "recording_sessions",
    "recording_session_items",
    "content_review_comments",
    "calendar_important_dates",
    "campaign_deliverables",
    "campaign_payments",
    "sales_records",
    "taxonomy_options",
    "taxonomy_change_audit",
    "import_batches",
    "import_entity_links",
  ];

  it("cria todas as 27 tabelas do domínio", async () => {
    const result = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public';`
    );
    const tableNames = result.rows.map((r) => r.table_name);
    for (const table of expectedTables) {
      expect(tableNames).toContain(table);
    }
  });

  it("habilita RLS em todas as tabelas públicas", async () => {
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r';`
    );
    for (const row of result.rows) {
      expect(row.relrowsecurity, `RLS deveria estar habilitado em ${row.relname}`).toBe(true);
    }
  });
});

describe("configurações e importação (Prompt 13)", () => {
  it("aplica um lote confirmado uma única vez", async () => {
    const userId=await createAuthUser("import-once@example.com");await actAsUser(userId);
    const batch=await db.query<{id:string}>(`insert into public.import_batches(user_id,file_name,file_hash,status,payload) values($1,'fixture.xlsx','hash-once','confirmed', '{"content_items":[{"legacy_id":"A-1","title":"Conteúdo histórico","status":"idea","resolution":"create"}],"errors":[]}'::jsonb) returning id`,[userId]);
    const first=await db.query(`select public.apply_import_batch($1)`,[batch.rows[0].id]);const second=await db.query(`select public.apply_import_batch($1)`,[batch.rows[0].id]);
    expect(first.rows).toEqual(second.rows);const rows=await db.query(`select id from public.content_items where title='Conteúdo histórico'`);expect(rows.rows).toHaveLength(1);
  });

  it("faz rollback do lote inteiro quando uma linha intermediária falha", async () => {
    const userId=await createAuthUser("import-rollback@example.com");await actAsUser(userId);
    const payload='{"content_items":[{"legacy_id":"R-1","title":"Válido","status":"idea"},{"legacy_id":"R-2","title":"Inválido","status":"nao_existe"}],"errors":[]}'
    const batch=await db.query<{id:string}>(`insert into public.import_batches(user_id,file_name,file_hash,status,payload) values($1,'rollback.xlsx','hash-rollback','confirmed',$2::jsonb) returning id`,[userId,payload]);
    await expect(db.query(`select public.apply_import_batch($1)`,[batch.rows[0].id])).rejects.toThrow();const rows=await db.query(`select id from public.content_items where user_id=$1 and title='Válido'`,[userId]);expect(rows.rows).toHaveLength(0);
  });

  it("isola lotes entre usuários por RLS", async () => {
    const userA=await createAuthUser("import-a@example.com"),userB=await createAuthUser("import-b@example.com");await actAsUser(userA);await db.query(`insert into public.import_batches(user_id,file_name,file_hash) values($1,'a.xlsx','hash-a')`,[userA]);await actAsUser(userB);const rows=await db.query(`select id from public.import_batches`);expect(rows.rows).toHaveLength(0);
  });
});

describe("campanhas e receita (Prompt 12)", () => {
  it("suporta múltiplos pagamentos e recebimento parcial sem persistir saldo derivado", async () => {
    const userId = await createAuthUser("financeiro@example.com"); await actAsUser(userId);
    const campaign = await db.query<{id:string}>(`insert into public.campaigns (user_id,name,contracted_fee,negotiation_status) values ($1,'Parceria',3000,'approved') returning id;`,[userId]);
    await db.query(`insert into public.campaign_payments (user_id,campaign_id,amount,received_amount,received_at,status) values ($1,$2,1000,1000,now(),'paid'),($1,$2,1000,400,now(),'partially_paid'),($1,$2,1000,null,null,'awaiting_payment');`,[userId,campaign.rows[0].id]);
    const result=await db.query<{count:number;received:string}>(`select count(*)::int count, coalesce(sum(received_amount),0)::text received from public.campaign_payments where campaign_id=$1;`,[campaign.rows[0].id]);
    expect(result.rows[0]).toEqual({count:3,received:"1400.00"});
  });

  it("impede vincular duas vendas à mesma captura de métricas", async () => {
    const userId=await createAuthUser("dedupe@example.com");await actAsUser(userId);
    const product=await db.query<{id:string}>(`insert into public.products(user_id,name) values($1,'Produto') returning id;`,[userId]);
    const content=await db.query<{id:string}>(`insert into public.content_items(user_id,title) values($1,'Post') returning id;`,[userId]);
    const snap=await db.query<{id:string}>(`insert into public.metric_snapshots(user_id,content_item_id,window_type,sales,revenue) values($1,$2,'30d',2,100) returning id;`,[userId,content.rows[0].id]);
    await db.query(`insert into public.sales_records(user_id,product_id,content_item_id,metric_snapshot_id,source,sale_date) values($1,$2,$3,$4,'metric_snapshot','2026-09-04');`,[userId,product.rows[0].id,content.rows[0].id,snap.rows[0].id]);
    await expect(db.query(`insert into public.sales_records(user_id,product_id,metric_snapshot_id,source,sale_date) values($1,$2,$3,'metric_snapshot','2026-09-04');`,[userId,product.rows[0].id,snap.rows[0].id])).rejects.toThrow();
  });

  it("mantém zero diferente de ausência e rejeita métricas copiadas em venda por snapshot", async () => {
    const userId=await createAuthUser("zero-null-vendas@example.com");await actAsUser(userId);
    const product=await db.query<{id:string}>(`insert into public.products(user_id,name) values($1,'Produto') returning id;`,[userId]);
    const manual=await db.query<Record<string,unknown>>(`insert into public.sales_records(user_id,product_id,source,sale_date,link_clicks,sales_count,revenue) values($1,$2,'manual','2026-09-04',0,0,0) returning link_clicks,leads,sales_count,revenue;`,[userId,product.rows[0].id]);
    expect(manual.rows[0]).toMatchObject({link_clicks:0,leads:null,sales_count:0,revenue:"0.00"});
    await expect(db.query(`insert into public.sales_records(user_id,product_id,source,metric_snapshot_id,sale_date,revenue) values($1,$2,'metric_snapshot',gen_random_uuid(),'2026-09-04',100);`,[userId,product.rows[0].id])).rejects.toThrow();
  });

  it("isola pagamentos, entregáveis e vendas entre usuárias", async () => {
    const userA=await createAuthUser("negocio-a@example.com");const userB=await createAuthUser("negocio-b@example.com");await actAsUser(userA);
    const campaign=await db.query<{id:string}>(`insert into public.campaigns(user_id,name) values($1,'A') returning id;`,[userA]);
    const product=await db.query<{id:string}>(`insert into public.products(user_id,name) values($1,'A') returning id;`,[userA]);
    await db.query(`insert into public.campaign_payments(user_id,campaign_id,amount) values($1,$2,100);`,[userA,campaign.rows[0].id]);
    await db.query(`insert into public.campaign_deliverables(user_id,campaign_id,title) values($1,$2,'Reel');`,[userA,campaign.rows[0].id]);
    await db.query(`insert into public.sales_records(user_id,product_id,sale_date) values($1,$2,'2026-09-04');`,[userA,product.rows[0].id]);
    await actAsUser(userB);
    for(const table of ["campaign_payments","campaign_deliverables","sales_records"]){const result=await db.query(`select * from public.${table};`);expect(result.rows).toHaveLength(0)}
    await expect(db.query(`insert into public.campaign_payments(user_id,campaign_id,amount) values($1,$2,100);`,[userB,campaign.rows[0].id])).rejects.toThrow();
  });
});

describe("handle_new_user", () => {
  it("cria profiles e app_settings automaticamente ao inserir em auth.users", async () => {
    const userId = await createAuthUser("nova-usuaria@example.com");

    const profile = await db.query(`select * from public.profiles where id = $1;`, [userId]);
    expect(profile.rows).toHaveLength(1);

    const settings = await db.query(`select * from public.app_settings where user_id = $1;`, [
      userId,
    ]);
    expect(settings.rows).toHaveLength(1);
  });
});

describe("histórico de status de content_items", () => {
  it("registra o status inicial ao criar um content_item", async () => {
    const userId = await createAuthUser("historico1@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Ideia teste') returning id;`,
      [userId]
    );
    const itemId = item.rows[0].id;

    const history = await db.query(
      `select previous_status, new_status from public.content_status_history where content_item_id = $1;`,
      [itemId]
    );
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]).toMatchObject({ previous_status: null, new_status: "idea" });
  });

  it("registra mudanças subsequentes de status e ignora updates que não mudam o status", async () => {
    const userId = await createAuthUser("historico2@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Ideia 2') returning id;`,
      [userId]
    );
    const itemId = item.rows[0].id;

    await db.query(`update public.content_items set status = 'researching' where id = $1;`, [
      itemId,
    ]);
    await db.query(`update public.content_items set title = 'Ideia 2 (editada)' where id = $1;`, [
      itemId,
    ]);
    await db.query(`update public.content_items set status = 'scripting' where id = $1;`, [
      itemId,
    ]);

    const history = await db.query<{ previous_status: string | null; new_status: string }>(
      `select previous_status, new_status from public.content_status_history
       where content_item_id = $1 order by changed_at asc;`,
      [itemId]
    );
    expect(history.rows).toHaveLength(3);
    expect(history.rows.map((r) => r.new_status)).toEqual(["idea", "researching", "scripting"]);
  });
});

describe("isolamento entre usuários (RLS)", () => {
  it("impede SELECT/INSERT/UPDATE/DELETE de content_items de outro usuário", async () => {
    const userA = await createAuthUser("usuaria-a@example.com");
    const userB = await createAuthUser("usuaria-b@example.com");

    await actAsUser(userA);
    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Conteúdo da A') returning id;`,
      [userA]
    );
    const itemId = item.rows[0].id;

    await actAsUser(userB);

    const selectResult = await db.query(`select * from public.content_items where id = $1;`, [
      itemId,
    ]);
    expect(selectResult.rows).toHaveLength(0);

    await expect(
      db.query(`insert into public.content_items (user_id, title) values ($1, 'Invasão') returning id;`, [
        userA,
      ])
    ).rejects.toThrow();

    const updateResult = await db.query(
      `update public.content_items set title = 'Hackeado' where id = $1;`,
      [itemId]
    );
    expect(updateResult.affectedRows ?? 0).toBe(0);

    const deleteResult = await db.query(`delete from public.content_items where id = $1;`, [
      itemId,
    ]);
    expect(deleteResult.affectedRows ?? 0).toBe(0);

    await actAsUser(userA);
    const stillThere = await db.query(`select title from public.content_items where id = $1;`, [
      itemId,
    ]);
    expect(stillThere.rows).toHaveLength(1);
    expect(stillThere.rows[0]).toMatchObject({ title: "Conteúdo da A" });
  });

  it("content_status_history é imutável mesmo para o próprio dono (sem policy de update/delete)", async () => {
    const userId = await createAuthUser("imutavel@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Imutável') returning id;`,
      [userId]
    );
    const itemId = item.rows[0].id;

    const before = await db.query(
      `select count(*)::int as count from public.content_status_history where content_item_id = $1;`,
      [itemId]
    );

    const updateResult = await db.query(
      `update public.content_status_history set new_status = 'published' where content_item_id = $1;`,
      [itemId]
    );
    expect(updateResult.affectedRows ?? 0).toBe(0);

    const deleteResult = await db.query(
      `delete from public.content_status_history where content_item_id = $1;`,
      [itemId]
    );
    expect(deleteResult.affectedRows ?? 0).toBe(0);

    const after = await db.query(
      `select count(*)::int as count from public.content_status_history where content_item_id = $1;`,
      [itemId]
    );
    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  it("impede acesso de outro usuário ao content_status_history", async () => {
    const userA = await createAuthUser("historico-a@example.com");
    const userB = await createAuthUser("historico-b@example.com");

    await actAsUser(userA);
    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Histórico A') returning id;`,
      [userA]
    );
    const itemId = item.rows[0].id;

    await actAsUser(userB);
    const result = await db.query(
      `select * from public.content_status_history where content_item_id = $1;`,
      [itemId]
    );
    expect(result.rows).toHaveLength(0);
  });
});

describe("regras de dados", () => {
  it("metric_snapshots: uma leitura por janela fixa por conteúdo, janelas custom podem se repetir", async () => {
    const userId = await createAuthUser("metricas@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Com métricas') returning id;`,
      [userId]
    );
    const itemId = item.rows[0].id;

    await db.query(
      `insert into public.metric_snapshots (content_item_id, user_id, window_type, views) values ($1, $2, '24h', 1000);`,
      [itemId, userId]
    );

    await expect(
      db.query(
        `insert into public.metric_snapshots (content_item_id, user_id, window_type, views) values ($1, $2, '24h', 2000);`,
        [itemId, userId]
      )
    ).rejects.toThrow();

    await db.query(
      `insert into public.metric_snapshots (content_item_id, user_id, window_type, window_start, window_end, views)
       values ($1, $2, 'custom', now() - interval '1 day', now(), 500);`,
      [itemId, userId]
    );
    await db.query(
      `insert into public.metric_snapshots (content_item_id, user_id, window_type, window_start, window_end, views)
       values ($1, $2, 'custom', now() - interval '2 day', now(), 700);`,
      [itemId, userId]
    );

    const customSnapshots = await db.query(
      `select id from public.metric_snapshots where content_item_id = $1 and window_type = 'custom';`,
      [itemId]
    );
    expect(customSnapshots.rows).toHaveLength(2);
  });

  it("regra crítica: ausência de dado é null e não zero", async () => {
    const userId = await createAuthUser("null-nao-zero@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Sem métricas ainda') returning id;`,
      [userId]
    );
    const itemId = item.rows[0].id;

    const snapshot = await db.query(
      `insert into public.metric_snapshots (content_item_id, user_id, window_type)
       values ($1, $2, '7d') returning views, likes, comments, revenue, retention_rate;`,
      [itemId, userId]
    );

    const row = snapshot.rows[0] as Record<string, unknown>;
    expect(row.views).toBeNull();
    expect(row.likes).toBeNull();
    expect(row.comments).toBeNull();
    expect(row.revenue).toBeNull();
    expect(row.retention_rate).toBeNull();
  });

  it("exclusão de conteúdo usa archived_at (soft delete) e continua consultável explicitamente", async () => {
    const userId = await createAuthUser("soft-delete@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Vou arquivar') returning id;`,
      [userId]
    );
    const itemId = item.rows[0].id;

    await db.query(`update public.content_items set archived_at = now() where id = $1;`, [
      itemId,
    ]);

    const activeOnly = await db.query(
      `select id from public.content_items where id = $1 and archived_at is null;`,
      [itemId]
    );
    expect(activeOnly.rows).toHaveLength(0);

    const includingArchived = await db.query<{ id: string; archived_at: string | null }>(
      `select id, archived_at from public.content_items where id = $1;`,
      [itemId]
    );
    expect(includingArchived.rows).toHaveLength(1);
    expect(includingArchived.rows[0].archived_at).not.toBeNull();

    // Hard delete continua tecnicamente possível (ex.: rotina de expurgo administrativa).
    const deleted = await db.query(`delete from public.content_items where id = $1;`, [itemId]);
    expect(deleted.affectedRows ?? 0).toBe(1);
  });
});

describe("check-in diário (Fase 4)", () => {
  it("impede duplicidade de check-in para a mesma usuária, conta e data", async () => {
    const userId = await createAuthUser("checkin-dup@example.com");
    await actAsUser(userId);

    const account = await db.query<{ id: string }>(
      `insert into public.instagram_accounts (user_id, handle) values ($1, 'contaunica') returning id;`,
      [userId]
    );
    const accountId = account.rows[0].id;

    await db.query(
      `insert into public.daily_checkins (user_id, account_id, checkin_date) values ($1, $2, '2026-09-03');`,
      [userId, accountId]
    );

    await expect(
      db.query(
        `insert into public.daily_checkins (user_id, account_id, checkin_date) values ($1, $2, '2026-09-03');`,
        [userId, accountId]
      )
    ).rejects.toThrow();
  });

  it("permite um check-in por conta no mesmo dia quando a usuária tem mais de uma conta", async () => {
    const userId = await createAuthUser("checkin-multiconta@example.com");
    await actAsUser(userId);

    const accountA = await db.query<{ id: string }>(
      `insert into public.instagram_accounts (user_id, handle) values ($1, 'contaa') returning id;`,
      [userId]
    );
    const accountB = await db.query<{ id: string }>(
      `insert into public.instagram_accounts (user_id, handle) values ($1, 'contab') returning id;`,
      [userId]
    );

    await db.query(
      `insert into public.daily_checkins (user_id, account_id, checkin_date) values ($1, $2, '2026-09-03');`,
      [userId, accountA.rows[0].id]
    );
    await db.query(
      `insert into public.daily_checkins (user_id, account_id, checkin_date) values ($1, $2, '2026-09-03');`,
      [userId, accountB.rows[0].id]
    );

    const rows = await db.query(
      `select id from public.daily_checkins where user_id = $1 and checkin_date = '2026-09-03';`,
      [userId]
    );
    expect(rows.rows).toHaveLength(2);
  });

  it("exige account_id (check-in é por conta, não só por usuária)", async () => {
    const userId = await createAuthUser("checkin-sem-conta@example.com");
    await actAsUser(userId);

    await expect(
      db.query(`insert into public.daily_checkins (user_id, checkin_date) values ($1, '2026-09-03');`, [userId])
    ).rejects.toThrow();
  });
});

describe("checklist_items (Fase 4)", () => {
  it("isola itens de checklist entre usuárias (RLS)", async () => {
    const userA = await createAuthUser("checklist-a@example.com");
    const userB = await createAuthUser("checklist-b@example.com");

    await actAsUser(userA);
    await db.query(`insert into public.checklist_items (user_id, label) values ($1, 'Gravei conteúdo');`, [userA]);

    await actAsUser(userB);
    const result = await db.query(`select * from public.checklist_items where user_id = $1;`, [userA]);
    expect(result.rows).toHaveLength(0);
  });

  it("não permite dois itens com o mesmo nome (case-insensitive) para a mesma usuária", async () => {
    const userId = await createAuthUser("checklist-dup@example.com");
    await actAsUser(userId);

    await db.query(`insert into public.checklist_items (user_id, label) values ($1, 'Postei stories');`, [userId]);

    await expect(
      db.query(`insert into public.checklist_items (user_id, label) values ($1, 'postei STORIES');`, [userId])
    ).rejects.toThrow();
  });
});

describe("daily_actions (Fase 4)", () => {
  it("is_active vem true por padrão e pode ser desativado sem apagar a ação", async () => {
    const userId = await createAuthUser("daily-actions-active@example.com");
    await actAsUser(userId);

    const action = await db.query<{ id: string; is_active: boolean }>(
      `insert into public.daily_actions (user_id, action_date, title) values ($1, '2026-09-03', 'Atualizei métricas') returning id, is_active;`,
      [userId]
    );
    expect(action.rows[0].is_active).toBe(true);

    await db.query(`update public.daily_actions set is_active = false where id = $1;`, [action.rows[0].id]);

    const stillThere = await db.query<{ is_active: boolean }>(
      `select is_active from public.daily_actions where id = $1;`,
      [action.rows[0].id]
    );
    expect(stillThere.rows).toHaveLength(1);
    expect(stillThere.rows[0].is_active).toBe(false);
  });
});

describe("roteirização (Fase 6)", () => {
  it("campos novos de content_items vêm com defaults seguros (arrays/objeto vazios, não null)", async () => {
    const userId = await createAuthUser("roteiro-defaults@example.com");
    await actAsUser(userId);

    const item = await db.query<{
      hook_variations: unknown;
      script_structure: unknown;
      shot_list: unknown;
      script_checklist: unknown;
      on_screen_text: string | null;
      estimated_duration_seconds: number | null;
    }>(
      `insert into public.content_items (user_id, title) values ($1, 'Roteiro novo')
       returning hook_variations, script_structure, shot_list, script_checklist, on_screen_text, estimated_duration_seconds;`,
      [userId]
    );

    const row = item.rows[0];
    expect(row.hook_variations).toEqual([]);
    expect(row.script_structure).toEqual([]);
    expect(row.shot_list).toEqual([]);
    expect(row.script_checklist).toEqual({});
    expect(row.on_screen_text).toBeNull();
    expect(row.estimated_duration_seconds).toBeNull();
  });

  it("rejeita duração estimada negativa", async () => {
    const userId = await createAuthUser("roteiro-duracao-negativa@example.com");
    await actAsUser(userId);

    await expect(
      db.query(
        `insert into public.content_items (user_id, title, estimated_duration_seconds) values ($1, 'Roteiro', -5);`,
        [userId]
      )
    ).rejects.toThrow();
  });

  it("aceita duração estimada zero e positiva", async () => {
    const userId = await createAuthUser("roteiro-duracao-ok@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title, estimated_duration_seconds) values ($1, 'Roteiro', 90) returning id;`,
      [userId]
    );
    expect(item.rows).toHaveLength(1);
  });

  it("salva e lista versões de roteiro para o próprio conteúdo, mais recente primeiro", async () => {
    const userId = await createAuthUser("versoes-lista@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Roteiro com versões') returning id;`,
      [userId]
    );
    const itemId = item.rows[0].id;

    await db.query(
      `insert into public.content_script_versions (user_id, content_item_id, snapshot) values ($1, $2, $3::jsonb);`,
      [userId, itemId, JSON.stringify({ script: "v1" })]
    );
    await db.query(
      `insert into public.content_script_versions (user_id, content_item_id, snapshot) values ($1, $2, $3::jsonb);`,
      [userId, itemId, JSON.stringify({ script: "v2" })]
    );

    const versions = await db.query<{ snapshot: { script: string } }>(
      `select snapshot from public.content_script_versions where content_item_id = $1 order by created_at desc;`,
      [itemId]
    );
    expect(versions.rows.map((row) => row.snapshot.script)).toEqual(["v2", "v1"]);
  });

  it("isola content_script_versions entre usuárias (RLS)", async () => {
    const userA = await createAuthUser("versoes-a@example.com");
    const userB = await createAuthUser("versoes-b@example.com");

    await actAsUser(userA);
    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Roteiro da A') returning id;`,
      [userA]
    );
    await db.query(
      `insert into public.content_script_versions (user_id, content_item_id, snapshot) values ($1, $2, '{}'::jsonb);`,
      [userA, item.rows[0].id]
    );

    await actAsUser(userB);
    const result = await db.query(
      `select * from public.content_script_versions where content_item_id = $1;`,
      [item.rows[0].id]
    );
    expect(result.rows).toHaveLength(0);
  });

  it("content_script_versions é imutável mesmo para a própria dona (sem policy de update/delete)", async () => {
    const userId = await createAuthUser("versoes-imutavel@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Roteiro imutável') returning id;`,
      [userId]
    );
    const version = await db.query<{ id: string }>(
      `insert into public.content_script_versions (user_id, content_item_id, snapshot) values ($1, $2, '{"script":"original"}'::jsonb) returning id;`,
      [userId, item.rows[0].id]
    );
    const versionId = version.rows[0].id;

    const updateResult = await db.query(
      `update public.content_script_versions set snapshot = '{"script":"alterado"}'::jsonb where id = $1;`,
      [versionId]
    );
    expect(updateResult.affectedRows ?? 0).toBe(0);

    const deleteResult = await db.query(`delete from public.content_script_versions where id = $1;`, [versionId]);
    expect(deleteResult.affectedRows ?? 0).toBe(0);

    const stillThere = await db.query<{ snapshot: { script: string } }>(
      `select snapshot from public.content_script_versions where id = $1;`,
      [versionId]
    );
    expect(stillThere.rows[0].snapshot.script).toBe("original");
  });
});

describe("gravação e edição (Fase 5)", () => {
  it("campos novos de content_items vêm com defaults seguros (arrays/objetos vazios, não null)", async () => {
    const userId = await createAuthUser("gravacao-defaults@example.com");
    await actAsUser(userId);

    const item = await db.query<{
      edit_visual_references: unknown;
      recording_checklist: unknown;
      edit_checklist: unknown;
      raw_file_url: string | null;
      editor_name: string | null;
    }>(
      `insert into public.content_items (user_id, title) values ($1, 'Gravação nova')
       returning edit_visual_references, recording_checklist, edit_checklist, raw_file_url, editor_name;`,
      [userId]
    );

    const row = item.rows[0];
    expect(row.edit_visual_references).toEqual([]);
    expect(row.recording_checklist).toEqual({});
    expect(row.edit_checklist).toEqual({});
    expect(row.raw_file_url).toBeNull();
    expect(row.editor_name).toBeNull();
  });

  it("cria e lista sessões de gravação da própria usuária", async () => {
    const userId = await createAuthUser("sessao-lista@example.com");
    await actAsUser(userId);

    await db.query(
      `insert into public.recording_sessions (user_id, session_date, location, scenario, outfit, available_minutes)
       values ($1, '2026-09-10', 'Estúdio em casa', 'Sala', 'Look neutro', 120);`,
      [userId]
    );

    const sessions = await db.query(`select * from public.recording_sessions where user_id = $1;`, [userId]);
    expect(sessions.rows).toHaveLength(1);
  });

  it("rejeita tempo disponível negativo numa sessão", async () => {
    const userId = await createAuthUser("sessao-tempo-negativo@example.com");
    await actAsUser(userId);

    await expect(
      db.query(`insert into public.recording_sessions (user_id, available_minutes) values ($1, -10);`, [userId])
    ).rejects.toThrow();
  });

  it("isola sessões de gravação entre usuárias (RLS)", async () => {
    const userA = await createAuthUser("sessao-a@example.com");
    const userB = await createAuthUser("sessao-b@example.com");

    await actAsUser(userA);
    const session = await db.query<{ id: string }>(
      `insert into public.recording_sessions (user_id, location) values ($1, 'Local da A') returning id;`,
      [userA]
    );

    await actAsUser(userB);
    const result = await db.query(`select * from public.recording_sessions where id = $1;`, [session.rows[0].id]);
    expect(result.rows).toHaveLength(0);
  });

  it("um content_item não pode ser adicionado duas vezes à mesma sessão", async () => {
    const userId = await createAuthUser("sessao-item-duplicado@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Conteúdo da sessão') returning id;`,
      [userId]
    );
    const session = await db.query<{ id: string }>(
      `insert into public.recording_sessions (user_id) values ($1) returning id;`,
      [userId]
    );

    await db.query(
      `insert into public.recording_session_items (user_id, session_id, content_item_id, sort_order) values ($1, $2, $3, 0);`,
      [userId, session.rows[0].id, item.rows[0].id]
    );

    await expect(
      db.query(
        `insert into public.recording_session_items (user_id, session_id, content_item_id, sort_order) values ($1, $2, $3, 1);`,
        [userId, session.rows[0].id, item.rows[0].id]
      )
    ).rejects.toThrow();
  });

  it("excluir a sessão remove seus itens em cascata, mas o content_item continua existindo", async () => {
    const userId = await createAuthUser("sessao-cascade@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Conteúdo permanece') returning id;`,
      [userId]
    );
    const session = await db.query<{ id: string }>(
      `insert into public.recording_sessions (user_id) values ($1) returning id;`,
      [userId]
    );
    await db.query(
      `insert into public.recording_session_items (user_id, session_id, content_item_id, sort_order) values ($1, $2, $3, 0);`,
      [userId, session.rows[0].id, item.rows[0].id]
    );

    await db.query(`delete from public.recording_sessions where id = $1;`, [session.rows[0].id]);

    const remainingItems = await db.query(
      `select * from public.recording_session_items where session_id = $1;`,
      [session.rows[0].id]
    );
    expect(remainingItems.rows).toHaveLength(0);

    const stillThere = await db.query(`select id from public.content_items where id = $1;`, [item.rows[0].id]);
    expect(stillThere.rows).toHaveLength(1);
  });

  it("comentário de revisão nasce aberto e pode ser marcado resolvido pela própria dona (não é imutável)", async () => {
    const userId = await createAuthUser("comentario-resolver@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Edição com comentário') returning id;`,
      [userId]
    );
    const comment = await db.query<{ id: string; status: string }>(
      `insert into public.content_review_comments (user_id, content_item_id, body) values ($1, $2, 'Cortar a pausa do início') returning id, status;`,
      [userId, item.rows[0].id]
    );
    expect(comment.rows[0].status).toBe("open");

    await db.query(`update public.content_review_comments set status = 'resolved' where id = $1;`, [comment.rows[0].id]);
    const resolved = await db.query<{ status: string }>(
      `select status from public.content_review_comments where id = $1;`,
      [comment.rows[0].id]
    );
    expect(resolved.rows[0].status).toBe("resolved");
  });

  it("rejeita status de comentário fora de open/resolved e corpo em branco", async () => {
    const userId = await createAuthUser("comentario-invalido@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Edição') returning id;`,
      [userId]
    );

    await expect(
      db.query(
        `insert into public.content_review_comments (user_id, content_item_id, body, status) values ($1, $2, 'ok', 'pendente');`,
        [userId, item.rows[0].id]
      )
    ).rejects.toThrow();

    await expect(
      db.query(`insert into public.content_review_comments (user_id, content_item_id, body) values ($1, $2, '   ');`, [
        userId,
        item.rows[0].id,
      ])
    ).rejects.toThrow();
  });

  it("isola comentários de revisão entre usuárias (RLS)", async () => {
    const userA = await createAuthUser("comentario-a@example.com");
    const userB = await createAuthUser("comentario-b@example.com");

    await actAsUser(userA);
    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Edição da A') returning id;`,
      [userA]
    );
    await db.query(`insert into public.content_review_comments (user_id, content_item_id, body) values ($1, $2, 'Comentário da A');`, [
      userA,
      item.rows[0].id,
    ]);

    await actAsUser(userB);
    const result = await db.query(`select * from public.content_review_comments where content_item_id = $1;`, [item.rows[0].id]);
    expect(result.rows).toHaveLength(0);
  });
});

describe("agendamento, publicados e planejamento (Fase 5/6)", () => {
  it("campos novos de content_items vêm com defaults seguros (arrays/objetos vazios, não null)", async () => {
    const userId = await createAuthUser("agendamento-defaults@example.com");
    await actAsUser(userId);

    const item = await db.query<{ hashtags: string[]; cover_image_url: string | null; scheduling_checklist: unknown }>(
      `insert into public.content_items (user_id, title) values ($1, 'Conteúdo novo')
       returning hashtags, cover_image_url, scheduling_checklist;`,
      [userId]
    );

    const row = item.rows[0];
    expect(row.hashtags).toEqual([]);
    expect(row.cover_image_url).toBeNull();
    expect(row.scheduling_checklist).toEqual({});
  });

  it("impede marcar como 'published' sem published_at (CHECK constraint)", async () => {
    const userId = await createAuthUser("publicado-sem-data@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title, status) values ($1, 'Sem data real', 'scheduled') returning id;`,
      [userId]
    );

    await expect(
      db.query(`update public.content_items set status = 'published' where id = $1;`, [item.rows[0].id])
    ).rejects.toThrow();
  });

  it("permite marcar como 'published' quando published_at está preenchido", async () => {
    const userId = await createAuthUser("publicado-com-data@example.com");
    await actAsUser(userId);

    const item = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title, status) values ($1, 'Com data real', 'scheduled') returning id;`,
      [userId]
    );

    await expect(
      db.query(
        `update public.content_items set status = 'published', published_at = now() where id = $1;`,
        [item.rows[0].id]
      )
    ).resolves.toBeDefined();
  });

  it("URL do post pode ficar vazia mesmo já publicado (só a data real é obrigatória)", async () => {
    const userId = await createAuthUser("publicado-sem-url@example.com");
    await actAsUser(userId);

    const item = await db.query<{ published_url: string | null }>(
      `insert into public.content_items (user_id, title, status, published_at) values ($1, 'Sem URL ainda', 'published', now())
       returning published_url;`,
      [userId]
    );
    expect(item.rows[0].published_url).toBeNull();
  });

  it("weekly_reviews aceita as novas colunas de planejamento e mantém o upsert por (user_id, week_start)", async () => {
    const userId = await createAuthUser("weekly-plan@example.com");
    await actAsUser(userId);

    await db.query(
      `insert into public.weekly_reviews (user_id, week_start, strategic_focus, weekly_experiment, planned_hours)
       values ($1, '2026-08-31', 'Foco em reels de rotina', 'Testar horário de postagem à noite', 8.5)
       on conflict (user_id, week_start) do update set strategic_focus = excluded.strategic_focus;`,
      [userId]
    );

    const first = await db.query<{ id: string; strategic_focus: string | null; planned_hours: string | null }>(
      `select id, strategic_focus, planned_hours from public.weekly_reviews where user_id = $1 and week_start = '2026-08-31';`,
      [userId]
    );
    expect(first.rows).toHaveLength(1);
    expect(first.rows[0].strategic_focus).toBe("Foco em reels de rotina");

    await db.query(
      `insert into public.weekly_reviews (user_id, week_start, strategic_focus)
       values ($1, '2026-08-31', 'Foco atualizado')
       on conflict (user_id, week_start) do update set strategic_focus = excluded.strategic_focus;`,
      [userId]
    );
    const second = await db.query<{ id: string; strategic_focus: string | null }>(
      `select id, strategic_focus from public.weekly_reviews where user_id = $1 and week_start = '2026-08-31';`,
      [userId]
    );
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0].id).toBe(first.rows[0].id);
    expect(second.rows[0].strategic_focus).toBe("Foco atualizado");
  });

  it("rejeita planned_hours negativo em weekly_reviews", async () => {
    const userId = await createAuthUser("weekly-plan-horas-negativas@example.com");
    await actAsUser(userId);

    await expect(
      db.query(
        `insert into public.weekly_reviews (user_id, week_start, planned_hours) values ($1, '2026-08-31', -1);`,
        [userId]
      )
    ).rejects.toThrow();
  });

  it("priority_content_id de weekly_reviews vira null se o conteúdo referenciado for excluído (on delete set null)", async () => {
    const userId = await createAuthUser("weekly-plan-fk-content@example.com");
    await actAsUser(userId);

    const content = await db.query<{ id: string }>(
      `insert into public.content_items (user_id, title) values ($1, 'Prioridade da semana') returning id;`,
      [userId]
    );
    await db.query(
      `insert into public.weekly_reviews (user_id, week_start, priority_content_id) values ($1, '2026-08-31', $2);`,
      [userId, content.rows[0].id]
    );

    await db.query(`delete from public.content_items where id = $1;`, [content.rows[0].id]);

    const review = await db.query<{ priority_content_id: string | null }>(
      `select priority_content_id from public.weekly_reviews where user_id = $1 and week_start = '2026-08-31';`,
      [userId]
    );
    expect(review.rows[0].priority_content_id).toBeNull();
  });

  it("cria, edita e exclui uma data importante do calendário", async () => {
    const userId = await createAuthUser("data-importante@example.com");
    await actAsUser(userId);

    const created = await db.query<{ id: string }>(
      `insert into public.calendar_important_dates (user_id, event_date, label) values ($1, '2026-09-20', 'Lançamento do produto X') returning id;`,
      [userId]
    );

    await db.query(`update public.calendar_important_dates set label = 'Lançamento adiado' where id = $1;`, [created.rows[0].id]);
    const updated = await db.query<{ label: string }>(`select label from public.calendar_important_dates where id = $1;`, [created.rows[0].id]);
    expect(updated.rows[0].label).toBe("Lançamento adiado");

    await db.query(`delete from public.calendar_important_dates where id = $1;`, [created.rows[0].id]);
    const afterDelete = await db.query(`select id from public.calendar_important_dates where id = $1;`, [created.rows[0].id]);
    expect(afterDelete.rows).toHaveLength(0);
  });

  it("rejeita data importante com nome em branco", async () => {
    const userId = await createAuthUser("data-importante-invalida@example.com");
    await actAsUser(userId);

    await expect(
      db.query(`insert into public.calendar_important_dates (user_id, event_date, label) values ($1, '2026-09-20', '   ');`, [userId])
    ).rejects.toThrow();
  });

  it("isola datas importantes entre usuárias (RLS)", async () => {
    const userA = await createAuthUser("data-importante-a@example.com");
    const userB = await createAuthUser("data-importante-b@example.com");

    await actAsUser(userA);
    await db.query(`insert into public.calendar_important_dates (user_id, event_date, label) values ($1, '2026-09-20', 'Data da A');`, [userA]);

    await actAsUser(userB);
    const result = await db.query(`select * from public.calendar_important_dates where event_date = '2026-09-20';`);
    expect(result.rows).toHaveLength(0);
  });

  it("duplicar como reaproveitamento cria um novo content_item com source_content_id apontando para o original, sem alterar o original", async () => {
    const userId = await createAuthUser("reaproveitamento@example.com");
    await actAsUser(userId);

    const original = await db.query<{ id: string; status: string }>(
      `insert into public.content_items (user_id, title, status, published_at, published_url)
       values ($1, 'Reel campeão', 'published', now(), 'https://instagram.com/p/original') returning id, status;`,
      [userId]
    );

    const repurposed = await db.query<{ id: string; status: string; source_content_id: string | null }>(
      `insert into public.content_items (user_id, title, status, source_content_id) values ($1, 'Reel campeão (reaproveitado)', 'idea', $2)
       returning id, status, source_content_id;`,
      [userId, original.rows[0].id]
    );

    expect(repurposed.rows[0].source_content_id).toBe(original.rows[0].id);
    expect(repurposed.rows[0].status).toBe("idea");

    const originalAfter = await db.query<{ status: string }>(`select status from public.content_items where id = $1;`, [original.rows[0].id]);
    expect(originalAfter.rows[0].status).toBe("published");
  });
});
