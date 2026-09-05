/**
 * Service Worker do Cami Content OS.
 *
 * Em desenvolvimento (localhost / 127.0.0.1):
 *  - O Service Worker é imediatamente desativado e desregistrado.
 *  - Nenhum evento "fetch" é interceptado — o Next.js lida diretamente com
 *    compilação on-demand, fast refresh e HMR sem interferência de cache.
 *  - Caches antigos pertencentes ao Cami Content OS são limpos com segurança.
 *
 * Em produção:
 *  - Cacheia estritamente o shell público e a página offline (com estilos autocontidos).
 *  - Navegações: tenta a rede primeiro; em falha real de rede (dispositivo offline),
 *    serve o fallback /offline do cache.
 *  - Assets estáticos versionados (_next/static/): cache-first com atualização em segundo plano.
 *  - Mutações (POST/PUT/DELETE), dados autenticados e Server Actions: SEMPRE rede direta,
 *    sem cache e sem fila offline.
 */

const isDevHost =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname.endsWith(".local");

if (isDevHost) {
  // Em desenvolvimento, garante que qualquer SW residual seja desativado e removido
  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        try {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("cami-"))
              .map((key) => caches.delete(key)),
          );
        } catch {
          // Ignora erros de exclusão de cache
        }
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => {
          client.postMessage({ type: "DEV_SW_UNREGISTERED" });
        });
      })(),
    );
  });

  // NÃO escuta o evento 'fetch' em desenvolvimento!
} else {
  const CACHE_VERSION = "v2";
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
      caches
        .open(SHELL_CACHE)
        .then((cache) => cache.addAll(SHELL_URLS))
        .catch(() => undefined),
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("cami-") && key !== SHELL_CACHE)
              .map((key) => caches.delete(key)),
          ),
        )
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

    // Nunca interceptar mutações (POST/PUT/PATCH/DELETE)
    if (request.method !== "GET") {
      return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
      return;
    }

    // Navegação de página: rede primeiro; se a rede falhar, cai para /offline em cache
    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request).catch(async () => {
          const cached = await caches.match("/offline");
          return cached ?? Response.error();
        }),
      );
      return;
    }

    // Assets estáticos públicos e versionados: cache-first com atualização em segundo plano
    if (isSafeStaticAsset(url)) {
      event.respondWith(
        caches.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) {
                caches
                  .open(SHELL_CACHE)
                  .then((cache) => cache.put(request, response.clone()));
              }
              return response;
            })
            .catch(() => cached ?? Response.error());
          return cached ?? network;
        }),
      );
      return;
    }
  });
}
