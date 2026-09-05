# Relatório de Auditoria do Frontend — Cami Content OS

**Data:** 04 de setembro de 2026  
**Projeto:** Cami Content OS (Instagram Content Operating System)  
**Ambiente:** Node.js 24 / Windows / Turbopack / Supabase  
**Status da Auditoria:** Concluída (Somente Leitura e Diagnóstico — Sem alterações de código ou banco de dados)

---

## 1. Resumo Executivo

A auditoria completa realizada no repositório revela um **paradoxo técnico marcante**:

1. **A camada de engenharia, lógica de negócios e dados está excepcionalmente desenvolvida e robusta:**
   - **28 tabelas no Postgres** com Row Level Security (RLS) estrito avaliado por `(select auth.uid())`.
   - **446 testes unitários e de integração passando com 100% de sucesso** em 41 arquivos de teste (Vitest + Testing Library + pglite).
   - Tipagem rigorosa em TypeScript sem nenhum erro em `tsc --noEmit`.
   - Camada de dados centralizada em `src/lib/data/` e Server Actions em `src/lib/actions/` com invalidação de cache via `revalidatePath`.
   - Fórmulas analíticas, índices de performance ponderados por objetivo, detecção de gargalos, autosave com debounce e histórico imutável já implementados.

2. **Porém, a percepção da usuária de que o frontend "está incompleto, superficial ou praticamente não desenvolvido" é 100% justificada e decorre de 5 causas raiz visuais e estruturais:**
   - **A rota raiz (`/`) é um placeholder estático da Fase 1:** Ao abrir o site em `http://localhost:3000` (ou `3001`), o usuário dá de cara com uma página provisória dizendo textualmente: *"O projeto está configurado. Esta é uma página inicial temporária — as páginas reais do fluxo... serão implementadas nas próximas etapas."*. Não há redirecionamento automático para `/hoje`, nem botão para entrar ou acessar o sistema. Quem acessa o app pela primeira vez tem a certeza imediata de que nada foi feito.
   - **O banco Supabase de produção está com 0 usuários e 0 dados:** No projeto remoto (`ealxjxjbheuxthdayjtl.supabase.co`), existem 0 usuários em `auth.users`, 0 perfis e 0 registros em todas as tabelas. Como as rotas protegidas pelo middleware redirecionam qualquer requisição anônima para `/login?proximo=...`, e o cadastro pelo formulário de login exige confirmação de e-mail no Supabase ("Conta criada! Verifique seu e-mail..."), torna-se quase impossível navegar e visualizar o app sem contornar ou configurar a autenticação.
   - **Estética "template padrão shadcn / corporativo genérico":** O design visual não atingiu a direção desejada (feminina, editorial, sofisticada, premium e contemporânea). A interface utiliza a paleta de marca basicamente em botões rosa vibrante chapados (`#FF2E88`) sobre fundos brancos puros, com `<select>` nativos sem estilização refinada, inputs com bordas padrão cinza-bege, cards retangulares sem hierarquia de sombras e ausência de tipografia editorial marcante no corpo de texto.
   - **Síndrome da Tela Vazia ("Zero Data Syndrome"):** Quando as telas autenticadas são abertas sem dados prévios, quase todas exibem o mesmo componente `EmptyState` cinza com o ícone `Inbox`, ou cards cheios de traços (`—`). Não existe um fluxo de boas-vindas (*onboarding*), nem mensagens motivadoras ou cards com prévias visuais que ensinem a usar o sistema.
   - **Inconsistência na densidade e componentes de formulário:** Há páginas com formulários longos em cards empilhados sem ritmo visual (Check-in, Edição, Roteiros) e tabelas com campos de edição inline simples (`QuickTitle`, `StatusSelect` nativo) que parecem planilhas cinzas em vez de uma aplicação de gestão criativa de alta qualidade.

---

## 2. Stack Encontrada

| Camada | Tecnologia Realmente Utilizada | Versão no Projeto | Observações de Arquitetura |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 16.3.4 | Server Components por padrão; Client Components com `"use client"`. Turbopack ativo. |
| **Linguagem** | TypeScript | 5.x | Configuração estrita, tipos gerados e domínio unificado em `src/types/`. |
| **Estilização** | Tailwind CSS v4 | 4.x | Configuração CSS-first via `@theme inline` em `src/app/globals.css`. Sem `tailwind.config.js`. |
| **Componentes Base** | shadcn/ui (reprodução manual) | new-york | Escrito manualmente em `src/components/ui/` devido ao bloqueio sandbox da CLI oficial. Radix UI Slot, Dialog, DropdownMenu. |
| **Backend & BaaS** | Supabase | 2.115.0 | `@supabase/ssr` 0.12.5 (cookies de sessão) + `@supabase/supabase-js`. RLS em 28 tabelas. |
| **Formulários** | React Hook Form + Zod | RHF 7.87 / Zod 3.25 | Schemas centralizados em `src/lib/validations/`. Autosave customizado via hook `useAutosave`. |
| **Estado Remoto** | TanStack React Query | 5.102.8 | Configurado em `src/providers/query-provider.tsx`. |
| **Gráficos** | Recharts | 3.10.1 | Gráficos de barras, linhas e pizza em Dashboard, Métricas e Perfil. |
| **Interatividade DnD** | dnd-kit | Core 6.3 / Sortable 10.0 | Utilizado no Kanban de Ideias, Sessão de Gravação e Calendário Mensal. |
| **Manipulação de Datas**| date-fns | 4.4.0 | Locale `pt-BR` fixo e helpers com fuso horário `America/Sao_Paulo`. |
| **Ícones** | Lucide React | 1.40.0 | Utilizado em toda a aplicação para navegação e feedback. |
| **PWA & Offline** | Nativo (Manifest + SW) | — | `manifest.webmanifest` e `sw.js` com cache de assets estáticos e fallback `/offline`. |
| **Testes Unitários** | Vitest + Testing Library | Vitest 5.0.0 | 446 testes automatizados cobrindo regras, cálculos e isolamento RLS via `@electric-sql/pglite`. |
| **Testes E2E** | Playwright | 1.62.1 | Configurado com specs em `tests/e2e/`. |

---

## 3. Estado do Repositório

- **Controle de Versão (Git):** O repositório foi inicializado (`git init`), porém **nenhum commit foi realizado até o momento**.
- **Arquivos rastreados/modificados:** 18 arquivos modificados em `src/lib/data/`, `src/lib/navigation.ts`, `src/types/database.ts`, etc.
- **Arquivos não rastreados (untracked):** 109 arquivos contendo a implementação completa de todas as features (Fases 4 a 14), migrações SQL, componentes de UI, testes e scripts de documentação.
- **Integridade:** Nenhuma alteração da usuária foi revertida, sobrescrita ou descartada.

---

## 4. Comandos Executados e Resultados

| Comando | Propósito | Resultado | Diagnóstico |
| :--- | :--- | :--- | :--- |
| `npm run typecheck` | Checagem estática de tipos TypeScript | **Código de saída: 0** | Zero erros de tipagem em todo o projeto. |
| `npm run lint` | Validação de ESLint | **Código de saída: 0** | 0 erros. Apenas 7 avisos informativos do compilador React sobre chamadas de `watch()` do React Hook Form. |
| `npm run test` | Execução dos testes Vitest | **Código de saída: 0** | **446 testes aprovados em 41 arquivos** (56.91s). 100% verde. |
| `npm run build` | Build de produção Next.js | **Código de saída: 0** | Todas as 30 rotas do App Router compiladas e otimizadas com sucesso (Turbopack). |
| `Conexão Supabase` | Verificação do backend remoto | **HTTP 200 OK** | Projeto `ealxjxjbheuxthdayjtl.supabase.co` acessível via `anon` e `service_role`. Schema de 28 tabelas aplicado. **Total de usuários: 0**. |
| `Playwright Screenshots`| Capturas visuais automatizadas | **12 capturas geradas** | Screenshots em 3 resoluções (375px, 768px, 1440px) gerados via Microsoft Edge headless em `docs/screenshots/`. |

---

## 5. Matriz Completa das Rotas

Abaixo está o mapeamento detalhado de **todas as 33 rotas** presentes no projeto:

| Nome da Rota | URL | Finalidade Esperada | Componente Principal | Estado Atual | Dados Consumidos | Backend? | Tipo de Dados | Principais Problemas Encontrados | Classificação |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Início (Root)** | `/` | Portal inicial / Landing | `src/app/page.tsx` | Placeholder | Nenhum | Não | Estático | **CRÍTICO:** Exibe mensagem dizendo que o app ainda não foi feito. Sem link/redirecionamento para login ou `/hoje`. | **Placeholder** |
| **Login** | `/login` | Autenticação / Cadastro | `src/features/auth/login-form.tsx` | Funcional | `auth.users` | Sim | Real | Visual minimalista e cru. Sem logo de marca, sem estética editorial. Exige confirmação de e-mail. | **Funcional** |
| **Hoje** | `/hoje` | Visão central do dia | `src/app/(app)/hoje/page.tsx` | Funcional | `hoje.ts`, check-in, metas, itens | Sim | Real | Sem dados fica visualmente desolada (StatCards com "—", 0 itens). Cards com visual corporativo genérico. | **Funcional** |
| **Check-in** | `/checkin` | Registro matutino/noturno | `src/features/checkin/checkin-form.tsx` | Funcional | `daily_checkins`, `daily_actions` | Sim | Real | Se não houver conta do Instagram cadastrada, bloqueia com EmptyState. Formulário denso e vertical. | **Funcional** |
| **Alertas** | `/alertas` | Central de pendências | `src/features/alertas/alerts-workspace.tsx`| Funcional | `alert_dismissals`, itens, metas | Sim | Real | Cálculos puramente dinâmicos. Lista de alertas empilhada com pouco dinamismo visual. | **Funcional** |
| **Banco de Ideias** | `/ideias` | Pipeline de ideias (Tabela/Cards/Kanban) | `src/features/ideias/ideas-workspace.tsx` | Funcional | `content_items`, `content_series` | Sim | Real | Modos funcionais com DnD, mas modo tabela é árido e cinzento; cards têm pouca diferenciação visual. | **Funcional** |
| **Roteiros (Lista)**| `/roteiros` | Lista de itens em pesquisa/roteiro | `src/features/roteiros/roteiros-list.tsx` | Funcional | `content_items` | Sim | Real | Agrupamento por status estático. Cards simples com badges. | **Funcional** |
| **Roteiro (Workspace)**| `/roteiros/[id]` | Edição de roteiro, gancho e checklist | `src/features/roteiros/script-workspace.tsx` | Funcional | `content_items`, `script_versions` | Sim | Real | Editor completo com autosave, mas visual de formulário longo e inputs cinzentos, sem sensação de "estúdio de escrita". | **Funcional** |
| **Teleprompter** | `/roteiros/[id]/teleprompter` | Teleprompter em tela cheia | `src/features/roteiros/teleprompter-view.tsx` | Funcional | `content_items` | Sim | Real | Interface em tela cheia preta funcional com WakeLock, mas tipografia e controles poderiam ter melhor ergonomia. | **Funcional** |
| **Gravação** | `/gravacao` | Gestão de sessões em lote | `src/features/gravacao/gravacao-workspace.tsx` | Funcional | `content_items`, `recording_sessions` | Sim | Real | Modos Lista, Cards e Sessão em lote funcionais, cronômetro na tela. Visual de sessão pouco cinematográfico. | **Funcional** |
| **Edição (Lista)** | `/edicao` | Fila de pós-produção | `src/features/edicao/edicao-list.tsx` | Funcional | `content_items` | Sim | Real | Lista com filtros. Sem thumbnail ou visualização gráfica dos conteúdos. | **Funcional** |
| **Edição (Workspace)**| `/edicao/[id]` | Instruções de corte, capa e comentários| `src/features/edicao/edicao-workspace.tsx` | Funcional | `content_items`, `review_comments` | Sim | Real | Arquivos de vídeo são links de texto (sem player embutido ou upload direto para storage). | **Parcial** |
| **Agendamento (Lista)**| `/agendamento`| Conteúdos prontos para postar | `src/features/agendamento/agendamento-list.tsx` | Funcional | `content_items`, `campaigns` | Sim | Real | Lista com cards e data/hora agendada. Falta calendário de grade direta aqui. | **Funcional** |
| **Agendamento (Workspace)**| `/agendamento/[id]`| Checklist final e marcação de publicação | `src/features/agendamento/agendamento-workspace.tsx`| Funcional | `content_items`, `products` | Sim | Real | Funcional com diálogo de publicação obrigando data/hora real. Visual de formulário seco. | **Funcional** |
| **Publicados** | `/publicados` | Histórico de posts e reaproveitamento | `src/features/publicados/publicados-list.tsx` | Funcional | `content_items`, `metric_snapshots` | Sim | Real | Resumo de pendências 24h/7d/30d calculado. Duplicação funciona. Falta preview visual do post do Instagram. | **Funcional** |
| **Planejamento Semanal**| `/planejamento/semana` | Grade semanal e foco estratégico | `src/features/planejamento/weekly-plan-workspace.tsx` | Funcional | `weekly_reviews`, estatísticas | Sim | Real | Estatísticas e foco da semana. Grade de 7 dias com cards simples. | **Funcional** |
| **Calendário Mensal**| `/planejamento/calendario` | Calendário editorial com drag-and-drop | `src/features/planejamento/calendar-month-view.tsx` | Funcional | `content_items`, `important_dates` | Sim | Real | Grid mensal de 35-42 dias bem implementada com dnd-kit, mas em telas mobile sofre compressão. | **Funcional** |
| **Metas** | `/metas` | Gestão de metas e ritmo de progresso | `src/features/metas/metas-workspace.tsx` | Funcional | `goals`, `profile_snapshots` | Sim | Real | Regra visual do status explicada. Barra de progresso nativa simples. Falta gráfico de velocímetro ou impacto. | **Funcional** |
| **Métricas dos Conteúdos**| `/metricas/conteudos` | Tabela e ranking de posts | `src/features/metricas/metricas-workspace.tsx` | Funcional | `content_items`, `metric_snapshots` | Sim | Real | Tabela comparativa e ranking em barras Recharts. Drawer de captura com modo rápido/completo. Tabela densa. | **Funcional** |
| **Métrica do Conteúdo (Detalhe)**| `/metricas/conteudos/[id]`| Diagnóstico de performance e índice | `src/features/metricas/metricas-detail.tsx` | Funcional | `metric_snapshots` | Sim | Real | Breakdown do índice de performance excelente e transparente. Tabela de 22 métricas é longa e técnica. | **Funcional** |
| **Métricas do Perfil**| `/metricas/perfil` | Histórico de seguidores e alcance | `src/features/perfil/perfil-workspace.tsx` | Funcional | `profile_snapshots`, contas | Sim | Real | Gráficos de linha de tendência e tabela diária. Formulário em drawer. Visual frio. | **Funcional** |
| **Revisão Semanal**| `/revisao-semanal` | Retrospectiva da semana | `src/features/revisao-semanal/weekly-review-workspace.tsx`| Funcional | `weekly_reviews`, comparativo | Sim | Real | Compara semana anterior e calcula destaques. Formulário longo de 7 campos reflexivos. | **Funcional** |
| **Dashboard** | `/dashboard` | Painel gerencial executivo | `src/features/dashboard/dashboard-workspace.tsx` | Funcional | Itens, métricas, metas, perfil | Sim | Real | Múltiplos gráficos Recharts, filtros em popover/bar. Visual cinza e branco genérico. | **Funcional** |
| **Campanhas** | `/negocio/campanhas` | Gestão de parcerias e publis | `src/features/negocio/campaigns-workspace.tsx` | Funcional | `campaigns`, `campaign_payments` | Sim | Real | Lista de campanhas com 4 status independentes. Cards corporativos simples. | **Funcional** |
| **Campanha (Detalhe)**| `/negocio/campanhas/[id]`| Entregáveis, parcelas e financeiro | `src/features/negocio/campaign-detail-workspace.tsx` | Funcional | Deliverables, payments, sales | Sim | Real | Muito completa em regras de negócio, mas visualmente parecendo um painel de faturamento padrão. | **Funcional** |
| **Produtos e Vendas**| `/negocio/produtos` | Catálogo e atribuição de vendas | `src/features/negocio/products-sales-workspace.tsx` | Funcional | `products`, `sales_records` | Sim | Real | Catálogo com modal de cadastro. Tabela de vendas manual ou vinculada a métricas. | **Funcional** |
| **Receita** | `/negocio/receita` | Resumo financeiro consolidado | `src/features/negocio/revenue-workspace.tsx` | Funcional | Vendas, campanhas, pagamentos | Sim | Real | Cálculos consolidados de recebimento e atribuição. Cards e tabelas convencionais. | **Funcional** |
| **Configurações** | `/configuracoes` | Taxonomias, contas e backup | `src/features/configuracoes/settings-workspace.tsx` | Funcional | `app_settings`, contas, séries | Sim | Real | Abas para Taxonomias, Contas, Séries, Importação XLSX e Backup JSON/CSV. Funcional, mas muito árida. | **Funcional** |
| **Sessão (Diagnóstico)**| `/sessao` | Verificação técnica de auth e perfil | `src/app/sessao/page.tsx` | Funcional | `profiles`, `auth.users` | Sim | Real | Página técnica que não deveria ser exposta no fluxo da usuária. | **Funcional** |
| **Offline** | `/offline` | Tela informativa de falta de conexão | `src/app/offline/page.tsx` | Funcional | Nenhum | Não | Estático | Tela honesta avisando que escrita não é permitida sem internet. | **Funcional** |
| **Auth Code Error**| `/auth/auth-code-error` | Falha de token de e-mail | `src/app/auth/auth-code-error/page.tsx` | Funcional | Nenhum | Não | Estático | Card centralizado padrão informando link expirado. | **Funcional** |
| **Callback Auth**| `/auth/callback` | Route Handler OAuth/Magic Link | `src/app/auth/callback/route.ts` | Funcional | Sessão Supabase | Sim | Real | Troca de código PKCE e redirecionamento seguro via `safeNextPath`. | **Funcional** |
| **Backup API** | `/api/backup` | Download JSON de backup completo | `src/app/api/backup/route.ts` | Funcional | Todas as tabelas da usuária | Sim | Real | Gera JSON versionado sob demanda. | **Funcional** |

### Rotas que Não Aparecem na Navegação
1. `/` (Página raiz atual).
2. `/login` (Tela de autenticação).
3. `/sessao` (Página técnica de debug).
4. `/offline` (Fallback PWA).
5. `/auth/auth-code-error` (Erro de autenticação).
6. As rotas de detalhe acessadas via listas: `/roteiros/[id]`, `/roteiros/[id]/teleprompter`, `/edicao/[id]`, `/agendamento/[id]`, `/metricas/conteudos/[id]`, `/negocio/campanhas/[id]`.

### Itens de Navegação com Destinos Inexistentes
- **Nenhum.** Todos os 18 links da `Sidebar` e `BottomNav` apontam para páginas existentes e funcionais no App Router.

---

## 6. Inventário de Componentes

| Componente | Localização | Onde é Utilizado | Finalizado Visualmente? | Inconsistências Detectadas | Reutilizável? | Recomendação |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `PageHeader` | `components/layout/page-header.tsx` | Todas as páginas do app | **Parcial** | Título com `font-serif` bonito, mas descrição pequena e espaçamento rígido. Ações ficam empilhadas no mobile. | Sim | **Preservar & Refinar** (melhorar tipografia e ações mobile). |
| `StatCard` | `components/layout/stat-card.tsx` | Hoje, Dashboard, Ideias, Métricas | **Parcial** | Borda fina, fundo branco plano, sombra quase invisível. Parece card padrão de template genérico. | Sim | **Substituir Estilo** (adicionar micro-elevação, tipografia expressiva e toque de cor suave). |
| `StatusBadge` | `components/layout/status-badge.tsx` | Cards de conteúdo, tabelas, cabeçalhos | **Sim** | Possui texto + cor + ícone (acessível). Usa tons suaves definidos em `toneClasses`. | Sim | **Preservar** (muito bem concebido). |
| `PriorityBadge` | `components/layout/priority-badge.tsx` | Ideias, Hoje, Roteiros | **Sim** | Segue o mesmo padrão acessível com ícones e rótulos em pt-BR. | Sim | **Preservar**. |
| `FilterBar` | `components/layout/filter-bar.tsx` | Ideias, Edição, Publicados, Dashboard | **Não** | Contêiner cinza simples sem elevação ou separação refinada. Em telas pequenas causa quebras estranhas. | Sim | **Refatorar** (tornar mais compacto, elegante e responsivo). |
| `SearchInput` | `components/ui/search-input.tsx` | FilterBars, CommandMenu | **Sim** | Campo com ícone de lupa e botão para limpar. | Sim | **Preservar**. |
| `DateRangePicker` | `components/ui/date-range-picker.tsx` | Dashboard, Filtros | **Parcial** | Dois inputs nativos de data + 3 botões rápidos. Não possui calendário flutuante visual. | Sim | **Evoluir** (adicionar popover com calendário visual). |
| `EmptyState` | `components/feedback/states.tsx` | Todas as telas sem dados | **Não** | Ícone `Inbox` com borda tracejada genérica. Sensação de "sistema abandonado" quando não há dados. | Sim | **Substituir Visualmente** (criar ilustrações ou empty states acolhedores e acionáveis com CTA). |
| `LoadingSkeleton` / `LoadingState` | `components/feedback/states.tsx` e `loading-skeleton.tsx` | Fallbacks de carregamento | **Sim** | Skeletons com animação suave de pulso. | Sim | **Preservar**. |
| `ErrorState` | `components/feedback/states.tsx` | Telas com erro de Supabase | **Sim** | Mensagem em vermelho suave (`border-destructive/30`). | Sim | **Preservar**. |
| `FormDrawer` | `components/layout/form-drawer.tsx` | Captura rápida, Ideias, Métricas | **Sim** | Sheet lateral no desktop, tela cheia no mobile. Funciona bem. | Sim | **Preservar & Polir** (melhorar cabeçalho e botão de fechar). |
| `ConfirmDialog` | `components/layout/confirm-dialog.tsx` | Exclusões e arquivamentos | **Sim** | Diálogo acessível Radix com confirmação e estado de loading. | Sim | **Preservar**. |
| `SaveStatusIndicator` | `components/feedback/save-status-indicator.tsx` | Check-in, Roteiros, Edição, Agendamento | **Sim** | Mostra "Salvando...", "Salvo às HH:mm" ou erro com retry. | Sim | **Preservar** (ótima experiência de feedback). |
| `Select` (Nativo) | `components/ui/select.tsx` | Check-in, Roteiros, Ideias, Configurações | **Não** | `<select>` HTML nativo com seta absoluta. Em desktop parece formulário web antigo; não abre menu flutuante estilizado. | Não | **Substituir** por um Select estilizado com Radix Dropdown. |
| `Button` | `components/ui/button.tsx` | Toda a interface | **Parcial** | Botão primário com `#FF2E88` puro fica muito agressivo e plano. Falta variante editorial suave. | Sim | **Refinar Variantes** (adicionar variantes com bege quente e hover sofisticado). |
| `Card` | `components/ui/card.tsx` | Toda a interface | **Parcial** | Borda cinza padrão (`#F0E4DD`) e sombra sutil. Falta profundidade e acabamento premium. | Sim | **Refinar Tokens de Estilo**. |
| `Sidebar` | `components/layout/sidebar.tsx` | Desktop (md+) | **Parcial** | Fundo bege (`#F7F1EB`), mas itens ativos usam fundo rosa choque chapado com texto branco. Pouco refinado. | Sim | **Refinar Visual** (melhorar tipografia e indicador de item ativo). |
| `BottomNav` | `components/layout/bottom-nav.tsx` | Mobile (abaixo de md) | **Sim** | Barra inferior com 5 ícones principais + drawer "Mais". | Sim | **Preservar & Polir**. |
| `TopBar` | `components/layout/top-bar.tsx` | Cabeçalho fixo superior | **Parcial** | Busca ampla, alternador de tema, conta e captura rápida. É funcional, mas parece barra utilitária técnica. | Sim | **Refinar** (adicionar elegância editorial e branding). |

---

## 7. Estado do Design System

### Mapeamento de Tokens Atuais em `src/app/globals.css`
- **Cores de Marca:**
  - Rosa Principal: `#FF2E88` (`--brand-rosa`, usado como `--primary`)
  - Laranja: `#FF6A3D` (`--brand-laranja`, usado como `--accent`)
  - Preto: `#0B0B0C` (`--brand-preto`, usado como `--foreground`)
  - Branco: `#FFFFFF` (`--brand-branco`, usado como `--background`)
  - Rosa Claro: `#FFF4F7` (`--brand-rosa-claro`, usado como `--secondary`)
  - Bege Quente: `#F7F1EB` (`--brand-bege`, usado como `--muted` e `--sidebar`)
  - Bordas: `#F0E4DD`
- **Tipografia:**
  - `--font-serif`: `Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif` (usado apenas em títulos).
  - `--font-sans`: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif` (usado em todo o corpo, botões e tabelas).
  - `--font-mono`: Pilha monospace do sistema (usado em IDs e métricas técnicas).
- **Escala Tipográfica:**
  - `--text-display`: 2.5rem
  - `--text-headline`: 1.875rem
  - `--text-title`: 1.25rem
  - `--text-caption`: 0.8125rem
- **Espaçamento e Raio (Radius):**
  - `--radius`: `0.75rem` (12px). Variações em `calc(var(--radius) - 4px)` (sm) e `calc(var(--radius) + 4px)` (xl).
- **Sombras:**
  - Sombras calculadas em função de `--shadow-color: 11 11 12` (`shadow-xs` a `shadow-lg`). São sombras bem neutras e discretas.
- **Tema Escuro:**
  - Implementado em `.dark` com paleta de fundo escuro amadeirado (`#121014`) e rosa suavizado (`#FF5AA0`).

### Diagnóstico do Design System
**Existe uma fundação técnica de tokens, mas NÃO existe uma identidade visual finalizada.**
O projeto possui variáveis no CSS, mas o visual resultante ainda é:
1. **Excessivamente contrastado e cru:** O rosa `#FF2E88` puro aplicado em botões cheios de 100% de saturação sobre fundos muito claros cria uma estética estridente em vez de luxuosa/editorial.
2. **Tipografia sem caráter editorial no corpo:** O uso de `Georgia` fica restrito às tags `<h1>` e `<h2>`. Todo o resto da interface cai na fonte padrão do Windows (`Segoe UI`), que transmite a sensação imediata de um software corporativo genérico ou de um painel de administração comum.
3. **Componentes com aparência de rascunho:** O uso de `<select>` nativo com bordas retangulares finas quebra qualquer pretensão de interface premium.

---

## 8. Avaliação Visual por Página

### 1. Rota `/` (Início)
- **Estado:** Placeholder estático.
- **Problema:** Um card centralizado anunciando que o projeto é temporário. Bloqueia completamente a percepção do usuário. Deve redirecionar autenticados para `/hoje` e anônimos para `/login` ou apresentar uma tela de entrada elegante.

### 2. Rota `/login`
- **Estado:** Card básico centralizado.
- **Problema:** Parece uma tela de login padrão de tutorial. Sem logotipo com tipografia da marca, sem imagem de fundo suave ou elementos acolhedores.

### 3. Rota `/hoje`
- **Estado:** Funcional com dados reais.
- **Problema:** No estado vazio (quando não há tarefas planejadas nem check-in feito), 6 `StatCards` exibem `0` ou `—`, e os cards de foco exibem avisos em texto com links azuis/alaranjados. Falta um design que celebre o dia e convide a criar conteúdo.

### 4. Rota `/checkin`
- **Estado:** Funcional com autosave.
- **Problema:** Formulário muito extenso em um único card vertical longo. Sem conta cadastrada, exibe um `EmptyState` que exige ir em Configurações. As 3 prioridades e seletores de produto/campanha parecem um questionário burocrático em vez de um momento de reflexão rápida de 3 minutos.

### 5. Rota `/ideias` (Banco de Ideias)
- **Estado:** Três visualizações (Tabela, Cards, Kanban).
- **Problema:**
  - O **Kanban** com dnd-kit é excelente funcionalmente, mas as colunas são muito coladas e os cards dentro das colunas têm tipografia espremida.
  - A **Tabela** tem mais de 1000px de largura com campos de edição inline que parecem uma planilha de dados brutos sem espaçamento confortável.
  - Os filtros no topo acumulam seletores e botões sem harmonia visual.

### 6. Rota `/roteiros` e `/roteiros/[id]`
- **Estado:** Lista e Workspace com autosave e versões.
- **Problema:**
  - A lista agrupa por status, mas com cards brancos simples.
  - No workspace de edição, há muitos blocos empilhados (Briefing, Ganchos, Estrutura, Takes, Legenda, Notas, Checklist). Falta uma navegação por abas ou um layout de painel duplo (ex.: briefing na lateral e roteiro no centro) típico de aplicativos modernos de escrita criativa.

### 7. Rota `/roteiros/[id]/teleprompter`
- **Estado:** Tela cheia funcional.
- **Problema:** Cumpre seu objetivo perfeitamente com controles de velocidade, tamanho de fonte e WakeLock, mas os botões flutuantes poderiam ser mais ergonômicos e integrados esteticamente.

### 8. Rota `/gravacao`
- **Estado:** Três modos (Lista, Cards, Sessão em lote).
- **Problema:** O painel de sessão em lote é uma das melhores ideias de fluxo do sistema (organizar por roupa/cenário), mas a apresentação visual parece uma lista de tarefas genérica em vez de uma "ordem do dia" de estúdio de gravação.

### 9. Rota `/edicao` e `/edicao/[id]`
- **Estado:** Lista e Workspace de pós-produção.
- **Problema:** Como não há upload de arquivos no momento (apenas URLs), a página depende de campos de texto como "Link do vídeo bruto", "Link do vídeo editado". Não há thumbnail, prévia de vídeo ou linha do tempo visual.

### 10. Rota `/agendamento` e `/agendamento/[id]`
- **Estado:** Fila de postagem e checklist de publicação.
- **Problema:** Não há um simulador visual do feed ou prévia de como o post ficará no Instagram (imagem + carrossel + legenda cortada no "mais").

### 11. Rota `/publicados`
- **Estado:** Histórico e duplicação para reaproveitamento.
- **Problema:** Funciona muito bem em termos de dados e pendências de 24h/7d/30d, mas os cards dos posts são caixas cinzentas com links externos, sem o visual enriquecido que um criador de conteúdo espera ver do seu histórico.

### 12. Rota `/planejamento/semana`
- **Estado:** Foco estratégico e grade de 7 dias.
- **Problema:** Os dias da semana aparecem como colunas ou blocos simples. Não há visual de calendário semanal executivo tipo bloco de notas elegante.

### 13. Rota `/planejamento/calendario`
- **Estado:** Grid mensal com arrastar e soltar (dnd-kit).
- **Problema:** É a tela mais impressionante do ponto de vista de código, mas no desktop os dias com muitos conteúdos ficam comprimidos, e no mobile o grid de 7 colunas fica minúsculo, dificultando a leitura dos títulos dos posts.

### 14. Rota `/metas`
- **Estado:** Lista de metas com cálculo de ritmo.
- **Problema:** A regra de status de meta ("no ritmo", "em risco", etc.) é muito rica matematicamente, mas visualmente é mostrada como um texto explicativo estático no topo com barras de progresso nativas simples.

### 15. Rota `/metricas/conteudos` e `/metricas/conteudos/[id]`
- **Estado:** Ranking e tabela analítica detalhada.
- **Problema:** O detalhamento do índice de performance é muito transparente, mas a tabela com 22 métricas técnicas parece um relatório contábil, sem destaques visuais com cartões ilustrativos ou gráficos de radar/composição.

### 16. Rota `/metricas/perfil`
- **Estado:** Gráficos e tabela diária de seguidores e alcance.
- **Problema:** Gráficos de linha do Recharts funcionam, mas usam as cores padrão sem gradientes suaves ou preenchimento estético; a tabela diária é muito crua.

### 17. Rota `/revisao-semanal`
- **Estado:** Retrospectiva da semana anterior.
- **Problema:** Formulário muito longo com 7 áreas de texto (`what_worked`, `what_didnt_work`, etc.) sem divisão em etapas (passo a passo / wizard).

### 18. Rota `/dashboard`
- **Estado:** Painel geral com múltiplos gráficos e cartões.
- **Problema:** Estrutura clássica de "dashboard corporativo de vendas B2B", exatamente o que a especificação pediu para NÃO parecer. Falta leveza, calor editorial e foco no criador.

### 19. Rota `/negocio/*` (Campanhas, Produtos, Receita)
- **Estado:** CRUD completo de parcerias, entregáveis, pagamentos e vendas.
- **Problema:** As tabelas e formulários são extremamente técnicos e contábeis.

### 20. Rota `/configuracoes`
- **Estado:** Abas de configurações, importação XLSX e backup.
- **Problema:** Visual denso, tabelas de badges estáticas e formulário de importação com aspecto de sistema legado.

---

## 9. Avaliação de Responsividade

Testado nas larguras de viewport padrão: **375 px (Mobile)**, **768 px (Tablet)** e **1440 px (Desktop)**.

| Elemento / Tela | 375 px (Mobile) | 768 px (Tablet) | 1440 px (Desktop) | Diagnóstico e Riscos |
| :--- | :---: | :---: | :---: | :--- |
| **Navegação Principal** | BottomNav (5 ícones + Sheet "Mais") | Sidebar retrátil ou oculta | Sidebar fixa (w-64) | **Bom:** A navegação mobile funciona sem quebrar. O drawer "Mais" reúne todas as 18 rotas. |
| **Barra Superior (TopBar)** | Botões compactados, busca oculta | Ícones e busca visíveis | Layout completo | **Atenção:** Em 375px os botões de ação (QuickCapture, Theme, Sair) ficam espremidos. |
| **Tabelas de Dados (Ideias, Métricas, Vendas)** | Scroll horizontal forçado | Scroll horizontal | Visualização completa | **Ruim:** Tabelas com `min-w-[1000px]` exigem rolagem lateral penosa no mobile. Devem virar cards empilhados no mobile. |
| **Kanban de Ideias** | Scroll horizontal entre colunas | 2-3 colunas visíveis | Todas as colunas visíveis | **Regular:** Em mobile é difícil arrastar cards entre colunas distantes com o dedo. |
| **Calendário Mensal** | Grade 7 colunas comprimida | Grade legível | Grade espaçosa | **Crítico no Mobile:** Células de dias ficam estreitas demais (<50px) para exibir títulos de posts. Exige alternância para lista/agenda diária em mobile. |
| **Formulários e Drawers** | Ocupa 100% da largura | Painel deslizante (w-96) | Painel deslizante lateral | **Bom:** O `FormDrawer` se adapta para tela cheia em mobile conforme esperado. |
| **Modais e Diálogos** | Centralizados com padding 16px | Centralizados | Centralizados | **Bom:** Sem overflow lateral. |
| **Gráficos (Recharts)** | Redimensionamento automático | Redimensionamento automático | Redimensionamento fluido | **Atenção:** Gráficos com muitas legendas ou barras no mobile sofrem corte de rótulos nos eixos X. |

---

## 10. Estado da Integração com Dados Reais

- **Consultas (Queries):** Todas as 18 telas realizam queries reais no Postgres via Supabase Client (`src/lib/data/*`).
- **Mutações (Mutations):** Conectadas via Server Actions em `src/lib/actions/` com Zod validation e revalidação de tags/rotas.
- **Persistência de Formulários:** Todos os formulários principais (Check-in, Roteiro, Edição, Agendamento, Metas, Campanhas) gravam diretamente no banco de dados real.
- **Autosave com Debounce:** Implementado via hook `useAutosave` em Check-in, Roteiros, Edição e Agendamento.
- **Tratamento de Erros e Loading:** Quase todas as páginas encapsulam as chamadas com `try/catch` e exibem `<ErrorState>` caso ocorra falha no Supabase.
- **Mistura de dados mockados com reais:** **NÃO HÁ dados mockados mascarados como reais nas telas de produção.** Se não há dados, a aplicação exibe rigorosamente "—", "0" ou `EmptyState`.
- **Gargalo Real de Acesso:** O banco de produção contém **0 usuários** e **0 linhas**, tornando a aplicação visualmente inanimada até que um usuário real seja cadastrado e dados sejam inseridos.

---

## 11. Lista de Mocks e Placeholders

1. **Rota `/` (`src/app/page.tsx`):**
   - Página inicial estática da Fase 1, contendo texto provisório explícito.
2. **Armazenamento de Arquivos de Vídeo e Capa (`src/lib/services/file-upload.ts`):**
   - Como o Supabase Storage não foi provisionado com buckets para este app, o serviço existe apenas como contrato de interface; nas telas de Gravação, Edição e Agendamento, a usuária preenche URLs de texto (`raw_file_url`, `edited_file_url`, `cover_notes`).
3. **Assistente de IA para Ganchos e Roteiros (`src/lib/services/script-assist.ts`):**
   - Interface de contrato criada sem implementação de provedor de IA ativa (escopo Pós-MVP).
4. **Integração com API do Instagram:**
   - Inexistente por projeto (escopo Pós-MVP). Toda marcação de agendamento, publicação e contagem de métricas é manual e controlada pela usuária.
5. **Seletor de Contas na Barra Superior (`AccountSwitcher`):**
   - Dropdown visual presente, mas não persiste a troca da conta ativa no servidor (sempre usa a conta marcada como `is_primary` ou a mais antiga).

---

## 12. Erros e Bloqueios Encontrados

1. **[CRÍTICO] Bloqueio da Página Inicial:**
   - Um visitante que acessa a URL raiz `http://localhost:3000` recebe uma tela que afirma que o sistema não está pronto, sem qualquer ação para prosseguir.
2. **[CRÍTICO] Bloqueio do Primeiro Acesso (Zero Users + Auth Email Confirmation):**
   - As telas do aplicativo estão 100% atrás do middleware de proteção.
   - O projeto Supabase está com 0 usuários.
   - A criação de conta via `/login` pode ficar presa aguardando confirmação por e-mail no Supabase, impedindo a pessoa de entrar na aplicação e testar o produto.
3. **[ALTO] Dependência Obrigatória de Conta do Instagram no Check-in:**
   - `/checkin` bloqueia a entrada se `instagram_accounts` estiver vazia, direcionando para Configurações.
4. **[MÉDIO] Ausência de Mock/Modo Demonstração Seguro para Avaliação Visual:**
   - Por cumprir com rigor a regra de "não usar dados falsos", o app se torna visualmente estéril até que a usuária passe semanas alimentando dados reais.

---

## 13. Dívidas Técnicas do Frontend

1. **Dependência de Componentes HTML Nativos em Formulários:**
   - O `<select>` de formulários (`src/components/ui/select.tsx`) é um elemento HTML nativo estilizado com CSS simples, gerando uma experiência de baixa qualidade em desktops.
2. **Tabelas não responsivas para mobile:**
   - Uso intensivo de `<table>` com `min-w-[1000px]` em Banco de Ideias, Métricas e Negócio, gerando scroll horizontal em dispositivos móveis.
3. **Falta de Feedback Visual em Transições de Rota:**
   - O Next.js App Router faz navegações sem barra de progresso no topo (ex.: `nprogress`), dando a impressão de lentidão ao clicar em itens da barra lateral.
4. **Filtros do Dashboard não sincronizados com a URL:**
   - O Dashboard armazena filtros apenas no estado do React (`useState`), perdendo os filtros caso a página seja recarregada (ao contrário da Revisão Semanal que usa `?week=`).
5. **Avisos do React Compiler sobre `watch()` do React Hook Form:**
   - 7 arquivos geram warnings no ESLint porque usam `const values = watch()` com o compilador do React 19.

---

## 14. Funcionalidades Ausentes (Gaps em relação à Visão do Produto)

1. **Modo de visualização e simulação visual de Post (Preview de Feed do Instagram):**
   - O fluxo cobre todo o ciclo de criação, mas a criadora não consegue visualizar uma prévia de como o post (card, carrossel, reels) ficará formatado no Instagram.
2. **Onboarding / Assistente Inicial:**
   - Falta um fluxo passo a passo no primeiro login para cadastrar a conta, definir pilares e cadastrar a primeira ideia.
3. **Templates Visuais de Roteiro:**
   - Falta modelos pré-formatados de roteiros (ex.: Gancho Curiosidade + Desenvolvimento + CTA de Comentário).
4. **Visualização Semanal Alternativa no Calendário:**
   - O calendário só possui visão mensal; a visão semanal prometida ficou restrita à grade de Planejamento Semanal.

---

## 15. Lista Priorizada de Correções

### Nível 1: Crítico (Impedimentos Imediatos)
- **C-1:** Corrigir a rota raiz (`/`): Redirecionar usuários autenticados para `/hoje` e usuários não autenticados para uma página de boas-vindas sofisticada ou diretamente para `/login`.
- **C-2:** Garantir o fluxo de autenticação e primeiro acesso no Supabase (configurar confirmação automática de e-mail no painel do Supabase ou permitir login direto de desenvolvimento).
- **C-3:** Criar um Empty State Acolhedor com Onboarding para que a primeira experiência não seja uma tela em branco cheia de traços (`—`).

### Nível 2: Alto (Identidade Visual e Design System)
- **A-1:** Redesenhar o Design System para a estética **Feminina, Editorial e Premium**:
  - Incorporar uma fonte tipográfica editorial sofisticada para títulos e números em destaque.
  - Suavizar a aplicação do rosa choque (`#FF2E88`), combinando-o harmonicamente com o bege quente (`#F7F1EB`), rosa claro (`#FFF4F7`) e detalhes em laranja/dourado suave.
  - Substituir sombras duras por elevações suaves com reflexo de luz.
- **A-2:** Substituir os componentes de `<select>` nativos por seletores ricos com Radix UI.
- **A-3:** Redesenhar o `StatCard` com micrográficos, hierarquia de números elegantes e suporte a badges de tendência.

### Nível 3: Médio (Usabilidade e Layout)
- **M-1:** Transformar as tabelas densas no mobile em visualização de cartões expansíveis (*accordion cards*).
- **M-2:** No Calendário Mensal em telas móveis, adicionar alternância para visão em lista diária (*Agenda View*).
- **M-3:** Modularizar workspaces longos (Roteiros e Edição) com navegação interna por abas ou layout em duas colunas.
- **M-4:** Adicionar simulação visual de card de Instagram (preview de post) em Roteiros, Agendamento e Publicados.

### Nível 4: Baixo (Polimento Fino)
- **B-1:** Persistir a conta ativa do Instagram no `AccountSwitcher` via cookie ou cabeçalho.
- **B-2:** Sincronizar filtros do Dashboard com os `searchParams` da URL.
- **B-3:** Ajustar chamadas de `watch()` do React Hook Form para eliminar avisos do compilador React.

---

## 16. Ordem Recomendada de Implementação (Roadmap Visual Seguro)

Para que a reconstrução visual seja segura e não quebre nenhum teste ou contrato de dados existente, a ordem recomendada é:

1. **Etapa 1 — Destravar a Entrada e Navegação:**
   - Atualizar a rota raiz (`src/app/page.tsx`) com redirect seguro e página de entrada acolhedora.
   - Polir a tela de `/login` com estética editorial, logo e mensagem acolhedora.
   - Ajustar o fluxo de onboarding nas telas vazias (Hoje e Check-in).

2. **Etapa 2 — Refatoração do Design System e Componentes Compartilhados:**
   - Evoluir os tokens em `src/app/globals.css` (cores, sombras, tipografia, bordas).
   - Redesenhar `StatCard`, `PageHeader`, `FilterBar`, `Button` e criar um `Select` flutuante rico.
   - Redesenhar `EmptyState` com ilustrações vetoriais elegantes e botões de ação rápida.

3. **Etapa 3 — Reconstrução Visual das Telas Diárias (Core Loop):**
   - Redesenhar `/hoje` (painel editorial do dia com cartões premium).
   - Redesenhar `/checkin` (layout leve, rápido e com sensação de diário criativo).

4. **Etapa 4 — Reconstrução Visual do Pipeline de Conteúdo (Criar):**
   - Banco de Ideias (`/ideias`): Polir Kanban e cards; alternar tabela mobile para cards.
   - Roteiros (`/roteiros` e `[id]`): Layout de estúdio de escrita com abas/duas colunas.
   - Gravação (`/gravacao`): Visual moderno de claquete / ordem do dia.
   - Edição e Agendamento (`/edicao`, `/agendamento`): Visual de estúdio com previews.

5. **Etapa 5 — Reconstrução Visual do Planejamento e Análise (Planejar & Analisar):**
   - Calendário (`/planejamento/calendario`): Modo mobile agenda e visual de revista no desktop.
   - Dashboard e Métricas (`/dashboard`, `/metricas/*`): Gráficos com gradientes suaves, cartões analíticos modernos.
   - Revisão Semanal (`/revisao-semanal`): Modo passo a passo (*wizard* reflexivo).

---

## 17. Arquivos que Precisarão ser Alterados nas Próximas Etapas

### Design System & Layout
- `src/app/globals.css`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/top-bar.tsx`
- `src/components/layout/bottom-nav.tsx`
- `src/components/layout/page-header.tsx`
- `src/components/layout/stat-card.tsx`
- `src/components/layout/filter-bar.tsx`
- `src/components/feedback/states.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/select.tsx`

### Telas Principais
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/features/auth/login-form.tsx`
- `src/app/(app)/hoje/page.tsx`
- `src/features/hoje/*.tsx`
- `src/features/checkin/checkin-form.tsx`
- `src/features/ideias/ideas-workspace.tsx`
- `src/features/roteiros/script-workspace.tsx`
- `src/features/gravacao/gravacao-workspace.tsx`
- `src/features/edicao/edicao-workspace.tsx`
- `src/features/agendamento/agendamento-workspace.tsx`
- `src/features/planejamento/calendar-month-view.tsx`
- `src/features/dashboard/dashboard-workspace.tsx`
- `src/features/dashboard/dashboard-charts.tsx`

---

## 18. Screenshots e Capturas Realizadas

As capturas de tela representativas foram geradas em alta resolução (Device Scale Factor 2) via Microsoft Edge Headless e armazenadas no diretório `docs/screenshots/`:

| Tela | Mobile (375 × 812 px) | Tablet (768 × 1024 px) | Desktop (1440 × 900 px) |
| :--- | :--- | :--- | :--- |
| **Início (Root)** | `docs/screenshots/home-mobile.png` | `docs/screenshots/home-tablet.png` | `docs/screenshots/home-desktop.png` |
| **Login** | `docs/screenshots/login-mobile.png` | `docs/screenshots/login-tablet.png` | `docs/screenshots/login-desktop.png` |
| **Offline** | `docs/screenshots/offline-mobile.png` | `docs/screenshots/offline-tablet.png` | `docs/screenshots/offline-desktop.png` |
| **Erro de Código** | `docs/screenshots/auth-code-error-mobile.png` | `docs/screenshots/auth-code-error-tablet.png` | `docs/screenshots/auth-code-error-desktop.png` |

---
*Relatório de auditoria concluído em estrita conformidade com as regras do projeto.*
