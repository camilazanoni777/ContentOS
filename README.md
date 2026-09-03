# Cami Content OS

Sistema único para gestão da criação de conteúdo no Instagram — da primeira
ideia até a análise do resultado. Ver `CLAUDE.md` para a visão completa do
produto e as regras de arquitetura, e `TODO.md` para o roadmap por fases.

> Status atual: **Fase 2 — dados, autenticação e segurança.** O schema
> completo (14 tabelas), RLS por usuário, autenticação por e-mail/senha e a
> camada de acesso a dados já existem. Ainda não há telas de produto reais
> (Kanban, calendário, métricas etc.) — apenas login e uma página de
> verificação de sessão (`/sessao`).

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS v4, shadcn/ui, Supabase,
React Hook Form + Zod, TanStack Query, Recharts, dnd-kit, date-fns (pt-BR),
Vitest + Testing Library, Playwright.

## Pré-requisitos

- Node.js 20+ (desenvolvido com Node 22)
- npm

## Instalação

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com as credenciais do seu projeto Supabase
(`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Sem isso, as
partes do app que dependem do Supabase vão lançar um erro claro ao serem
usadas — a página inicial atual funciona sem Supabase configurado.

## Configurando o Supabase (necessário a partir da Fase 2)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie a Project URL e a anon public key (Project Settings → API) para o
   `.env.local`.
3. Aplique as migrations de `supabase/migrations/` (em ordem) — pela CLI
   (`npx supabase link --project-ref <ref>` e `npx supabase db push`) ou
   colando cada arquivo no SQL Editor do painel do Supabase.
4. Cadastre-se pelo próprio app (`/login` → "Criar conta"). Não é
   necessário nem recomendado rodar `supabase/seed.sql` a menos que você
   queira dados de exemplo — instruções completas de como usá-lo (com
   segurança, só em ambiente de desenvolvimento) estão no topo do próprio
   arquivo e em `CLAUDE.md`.

Detalhes completos sobre o schema, RLS e a camada de dados estão em
`CLAUDE.md` (seção "Banco de dados, autenticação e RLS").

## Comandos

| Comando                | O que faz                                            |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`            | Servidor de desenvolvimento (Turbopack)               |
| `npm run build`           | Build de produção                                      |
| `npm run start`             | Serve o build de produção                                |
| `npm run lint`               | ESLint                                                     |
| `npm run typecheck`           | `tsc --noEmit`                                              |
| `npm run test`                  | Testes unitários/componente (Vitest)                          |
| `npm run test:watch`             | Vitest em modo watch                                            |
| `npm run test:coverage`           | Vitest com relatório de cobertura                                |
| `npm run test:e2e`                 | Testes end-to-end (Playwright — requer `npx playwright install` antes) |

## Estrutura do projeto

```
src/
  app/            # Rotas (App Router) — inclui /login, /sessao, /auth/callback
  features/       # Um domínio por pasta (ideias, roteiros, gravacao, auth, ...)
  components/     # ui/ (shadcn/ui), layout/ e feedback/ (loading/empty/error)
  lib/
    data/         # Camada de acesso a dados — um arquivo por tabela
    supabase/     # client.ts, server.ts, middleware.ts
    auth/         # Server Actions de autenticação
    validations/  # Schemas Zod compartilhados entre domínios
  types/          # database.ts (gerado/mantido manualmente) e domain.ts
  providers/      # Composição de providers (TanStack Query, etc.)
  hooks/          # Hooks reutilizáveis
  test/           # Setup do Vitest
supabase/
  migrations/     # Migrations SQL versionadas (14 tabelas + RLS + triggers)
  tests/          # Testes de integração das migrations (pglite) + shim de auth
  seed.sql        # Seed de desenvolvimento — NUNCA aplicar em produção
tests/e2e/        # Specs do Playwright
```

Veja `CLAUDE.md` para os padrões de código e as regras de dados do projeto
(datas em pt-BR, campo não informado é `null`, exclusão é arquivar por
padrão, RLS obrigatório, etc.).

## Notas sobre o ambiente de desenvolvimento

Este projeto foi criado num ambiente com acesso de rede restrito, o que
afeta dois pontos:

- Os componentes de `src/components/ui/` foram escritos manualmente porque
  `ui.shadcn.com` estava bloqueado — se você tiver rede irrestrita, `npx
  shadcn add <componente>` deve funcionar normalmente e respeitar o
  `components.json` já configurado.
- O layout usa a pilha de fontes do sistema (não `next/font/google`) pelo
  mesmo motivo. Troque por `next/font/local` se quiser uma fonte de marca
  específica.

Detalhes completos em `CLAUDE.md` (seção "Ambiente de desenvolvimento").
