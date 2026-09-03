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
    "metric_snapshots",
    "profile_snapshots",
    "goals",
    "weekly_reviews",
    "campaigns",
    "products",
    "app_settings",
  ];

  it("cria todas as 14 tabelas do domínio", async () => {
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
