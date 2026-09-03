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

### As 14 tabelas

Todas em `public`, todas com `user_id uuid references auth.users` (exceto
`content_status_history`, que também tem `user_id` mas se relaciona
principalmente via `content_item_id`, e `profile_snapshots`/
`instagram_accounts`, que se relacionam via `account_id`/tabela própria) e
todas com RLS habilitado desde a migration que as cria:

`profiles`, `app_settings`, `instagram_accounts`, `content_series`,
`campaigns`, `products`, `content_items` (registro central), 
`content_status_history` (histórico imutável), `metric_snapshots`,
`profile_snapshots`, `daily_checkins`, `daily_actions`, `goals`,
`weekly_reviews`.

Migrations em `supabase/migrations/`, aplicadas nessa ordem pelo timestamp
no nome do arquivo. Nunca edite uma migration já aplicada em produção —
crie uma nova.

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
  `/auth/auth-code-error`), usando `supabase.auth.getUser()` (validado no
  servidor — nunca `getSession()` para decidir acesso).
- `/login` — tela de login/cadastro (única tela de produto desta fase).
- `/sessao` — página protegida de verificação de sessão (existe só para
  provar que login → middleware → leitura de dados funcionam de ponta a
  ponta; será substituída pela tela "Hoje" real numa fase futura).

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
