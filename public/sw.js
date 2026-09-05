/**
 * Service Worker do Cami Content OS.
 *
 * Escopo deliberadamente pequeno e auditável:
 *  - Cacheia só o "shell" público e estático (ícones, manifest, página
 *    offline, assets versionados do Next em /_next/static/) — nunca uma
 *    resposta autenticada, nunca dado pessoal.
 *  - Navegações (carregar uma página) tentam a rede primeiro; só em falha
 *    de rede (offline de verdade) respondemos com a página /offline em
 *    cache, nunca com uma cópia antiga de uma página autenticada.
 *  - Toda outra requisição (API routes, Server Actions, RSC data, POST/
 *    PUT/DELETE) passa direto para a rede, sem cache e sem fila offline —
 *    se não há conexão, a escrita falha com erro de rede normal em vez de
 *    ser silenciosamente enfileirada (não há idempotência/indicação de
 *    sincronização implementadas para justificar uma fila).
 *  - Atualização controlada: um SW novo fica em "waiting" até o cliente
 *    mandar {type:"SKIP_WAITING"} (ver register-sw.tsx), para não trocar
 *    de versão no meio de uma sessão em uso sem avisar.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `cami-shell-${CACHE_VERSION}`;

const SHELL_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isSafeStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Nunca interceptar mutações (POST/PUT/PATCH/DELETE — Server Actions
  // inclusas): seguem direto para a rede, sem cache e sem fila offline.
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navegação de página: rede primeiro, cai para /offline só se a rede falhar de fato.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // Assets estáticos públicos e versionados: cache-first com atualização em segundo plano.
  if (isSafeStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached ?? Response.error());
        return cached ?? network;
      }),
    );
    return;
  }

  // Qualquer outra requisição GET (API routes, dados de página, RSC payload):
  // sempre rede, nunca cache — pode conter dado autenticado/pessoal.
});
