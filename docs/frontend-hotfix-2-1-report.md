# Relatório Técnico — Hotfix Frontend 2.1: Recuperação do Aplicativo Preso no Fallback Offline

## 1. Causa Raiz Comprovada

Durante a auditoria e reprodução com o navegador e Playwright, foi identificada a cadeia exata de eventos que levou o aplicativo a ficar preso no fallback offline desestilizado:

1. **Registro Indiscriminado do Service Worker em Desenvolvimento:**
   No componente `src/providers/pwa-provider.tsx`, a chamada `navigator.serviceWorker.register("/sw.js")` era executada incondicionalmente em todos os ambientes, inclusive em `development` ao acessar `http://localhost:3001`.
2. **Queda Temporária de Conexão com o Servidor Local:**
   Quando o processo do servidor na porta 3001 foi interrompido (ou durante reinicializações do Next.js), qualquer tentativa de navegação no navegador disparou uma requisição `request.mode === "navigate"`.
3. **Interceptação Agressiva pelo Service Worker:**
   Em `public/sw.js`, o evento `fetch` capturou a rejeição da rede (`fetch(request).catch(...)`) e retornou o documento `/offline` armazenado no Cache Storage (`SHELL_CACHE: "cami-shell-v1"`).
4. **Ausência de Estilos Críticos Autocontidos no Fallback:**
   O Service Worker armazenava apenas o HTML da página `/offline`, sem pré-armazenar os arquivos CSS compilados do Next.js (`/_next/static/css/...`). Como o servidor local não respondia, a tentativa do navegador de carregar a folha de estilos falhava com erro de rede, fazendo com que o navegador exibisse a página de erro crua com a tipografia padrão serifada (Times New Roman), fundo branco e link azul sem formatação.
5. **Permanência no Estado Offline:**
   No navegador real da usuária, o Service Worker registrado continuou controlando a rota de escopo `http://localhost:3001/`. O botão "Tentar novamente" original era apenas uma tag `<a href="/hoje">` sem diagnóstico de rede nem verificação ativa de restabelecimento do servidor local.

---

## 2. Como o Problema Foi Reproduzido

A reprodução foi validada via script automatizado com Playwright:
1. Um navegador carregou a aplicação local com o Service Worker ativado e caches inicializados.
2. A conectividade foi interrompida (simulando servidor parado ou offline).
3. A navegação para o aplicativo entregou o HTML `/offline` sem folhas de estilo (reproduzindo exatamente a tela em Times New Roman documentada na captura).
4. Mesmo após reiniciar o servidor, o navegador manteve os caches desatualizados e a interceptação contínua.

---

## 3. Arquivos Modificados e Criados

| Arquivo | Ação | Descrição |
|---|---|---|
| `public/sw.js` | Modificado | Desativação total do SW em `localhost`/`127.0.0.1`, auto-desregistro imediato em dev e isolamento do cache de produção |
| `src/providers/pwa-provider.tsx` | Modificado | Não registra SW em desenvolvimento; purga com segurança caches residuais `cami-*` e desregistra workers antigos |
| `src/providers/pwa-provider.test.tsx` | Criado | Testes unitários do ciclo de vida do SW, limpeza de cache e aviso de offline |
| `src/lib/connection-diagnostic.ts` | Criado | Utilitário central para classificar erros (offline real vs. servidor indisponível vs. erro do Supabase vs. sessão expirada) e testar conectividade ativa via `/api/health` |
| `src/lib/connection-diagnostic.test.ts` | Criado | 6 testes unitários garantindo que erros HTTP e do Supabase não sejam rotulados como falta de internet |
| `src/app/api/health/route.ts` | Criado | Endpoint leve e público para validação de conectividade sem cache |
| `src/lib/supabase/middleware.ts` | Modificado | Inclusão de `/api/health` nas rotas públicas |
| `src/lib/supabase/middleware.test.ts` | Modificado | Atualização do teste de rotas públicas |
| `src/app/offline/layout.tsx` | Criado | Layout do fallback offline com metadata estática |
| `src/app/offline/page.tsx` | Reconstruído | Página com estilos críticos inline, monograma da marca, tipografia sans-serif, ícone de desconexão, aviso de não persistência e botão de retry inteligente com feedback visual |
| `src/app/offline/page.test.tsx` | Criado | Testes da interface offline e simulação de recuperação com sucesso |
| `src/app/error.tsx` | Criado | Error Boundary global integrado ao design system e ao classificador de diagnósticos |
| `src/app/error.test.tsx` | Criado | Testes do tratamento de erros do Supabase e sessão expirada |
| `src/features/hoje/today-header.tsx` | Modificado | Remoção do indicador falso/não-verificado "Sincronizado" |
| `scripts/capture-hotfix-2-1.mjs` | Criado | Script de automação visual para evidências no Playwright |

---

## 4. Comportamento em Desenvolvimento vs. Produção

### Em Desenvolvimento (`development` / `localhost` / `127.0.0.1`):
- O Service Worker **não é registrado** pelo `PwaProvider`.
- Se um Service Worker anterior ainda estiver ativo no navegador, o `sw.js` ao ser executado detecta o ambiente local e se auto-desregistra (`self.registration.unregister()`).
- Caches com prefixo `cami-` são excluídos automaticamente no carregamento da página.
- Caches de outros domínios ou aplicações locais não são afetados.
- Nenhum listener de `fetch` é ativado em desenvolvimento, garantindo fluxo direto com o Next.js (Fast Refresh, HMR e compilação sob demanda).
- Zero ciclos de recarregamento infinito (`reload loop`).

### Em Produção:
- O Service Worker registra o cache do shell público (`SHELL_CACHE: "cami-shell-v2"`).
- Navegações priorizam a rede (`network-first`); apenas em falha de conexão real (dispositivo offline), o fallback `/offline` é entregue.
- A página `/offline` contém CSS crítico autocontido no próprio HTML, garantindo apresentação visual idêntica ao design system mesmo se nenhuma folha de estilos externa puder ser transferida.
- Requisições de escrita (POST, PUT, DELETE), Server Actions e rotas de dados autenticadas nunca são cacheadas nem enfileiradas sem confirmação do servidor.

---

## 5. Como a Aplicação Classifica Conexão e Erros

A função `classifyError` em `src/lib/connection-diagnostic.ts` categoriza explicitamente o estado:

1. **Offline Real (`offline_device`):** `navigator.onLine === false`. Exibe "Você está offline" com orientação para verificar Wi-Fi/rede celular.
2. **Servidor Local Indisponível (`server_unreachable`):** `navigator.onLine === true`, mas `fetch` falha por conexão recusada. Mensagem informa explicitamente que a internet funciona, mas o processo na porta 3001 não está respondendo.
3. **Falha de Backend / Supabase (`backend_error`):** Ocorreu um `DataAccessError` ou resposta HTTP 500-504. Mensagem informa instabilidade no banco de dados sem rotular como offline.
4. **Sessão Expirada (`session_expired`):** Código HTTP 401 ou 403. Conduz o usuário ao fluxo de login (`/login`).
5. **Erro Inesperado (`unexpected_error`):** Falhas inesperadas de renderização ou exceções de código.

A recuperação ativa através do botão **"Tentar novamente"** realiza um ping com timeout em `/api/health?_t=...` (com `cache: "no-store"`). Caso responda com sucesso, exibe mensagem positiva ("Conexão restabelecida!") e redireciona o usuário para o aplicativo sem recarregamentos cegos.

---

## 6. Auditoria do Indicador "Sincronizado"

O indicador hardcoded "Sincronizado" presente no cabeçalho de `/hoje` (`TodayHeader`) foi auditado e **removido**. Como não há um protocolo de sincronização em segundo plano rodando na tela, exibir um status pulsante de sincronização induzia a usuária a falsas suposições sobre o salvamento offline. Em conformidade com a diretriz do projeto, quando não há verificação verdadeira de estado, o indicador não deve ser exibido.

---

## 7. Resultados dos Testes Automatizados

- **Vitest:** **53 arquivos executados · 486 testes passando com 100% de sucesso** (todos os 472 testes originais preservados + 14 novos testes).
- **TypeScript Strict:** `npm run typecheck` finalizado com **0 erros**.
- **ESLint:** `npm run lint` finalizado com **0 erros**.
- **Next.js Production Build:** `npm run build` gerou com sucesso as 34 rotas da aplicação, incluindo `/api/health` e `/offline`.

---

## 8. Evidências Visuais

As capturas de validação foram salvas em `docs/screenshots/frontend-hotfix-2-1/`:

1. `01-localhost-recovered.png` — Acesso a `http://localhost:3001/` recuperado, redirecionando com design system completo para o login.
2. `02-login-recovered.png` — Tela de login com estilos aplicados e sem interferência de cache.
3. `03-hoje-recovered.png` — Central do Dia (`/hoje`) recuperada e sem o indicador falso "Sincronizado".
4. `04-checkin-recovered.png` — Check-in Diário carregando com normalidade e todas as interações intactas.
5. `05-offline-styled.png` — Página offline com CSS crítico autocontido: fundo linho, cartão branco, tipografia sans-serif, monograma e botão framboesa.
6. `06-reconnected.png` — Feedback dinâmico após acionar "Tentar novamente" com conexão restabelecida.
