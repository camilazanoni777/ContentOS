"use client";

import * as React from "react";

/**
 * Registra o Service Worker (public/sw.js) e expõe dois avisos honestos ao
 * vivo, sem depender de nenhuma lib de PWA:
 *  - "você está offline": liga/desliga com os eventos online/offline do
 *    navegador — deixa claro que nenhuma escrita é salva nesse estado (não
 *    há fila offline; ver sw.js e CLAUDE.md).
 *  - "nova versão disponível": quando um SW novo fica esperando (updates
 *    controlados — nunca troca de versão sozinho no meio de uma sessão),
 *    oferece um botão para atualizar agora.
 */

// `navigator.onLine` só existe no navegador; no servidor assumimos "online"
// (getServerSnapshot) para casar com o HTML gerado no build/SSR e evitar
// erro de hidratação — o valor real do cliente é aplicado por
// useSyncExternalStore logo após a hidratação, sem precisar de um setState
// dentro de useEffect (que causaria uma renderização extra em cascata).
function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const isOnline = React.useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot,
  );
  const isOffline = !isOnline;
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;
        if (registration.waiting && registration.active) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && registration.active) {
              setWaitingWorker(installing);
            }
          });
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = React.useCallback(() => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    waitingWorker?.addEventListener("statechange", () => {
      if (waitingWorker.state === "activated") window.location.reload();
    });
  }, [waitingWorker]);

  return (
    <>
      {isOffline ? (
        <div role="status" className="bg-[var(--tone-warning-bg)] px-4 py-2 text-center text-sm text-[var(--tone-warning-fg)]">
          Você está sem conexão. Nenhuma alteração será salva até a internet voltar.
        </div>
      ) : null}
      {waitingWorker ? (
        <div role="status" className="flex items-center justify-center gap-3 bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground">
          Uma nova versão está disponível.
          <button type="button" onClick={applyUpdate} className="rounded-md bg-primary px-3 py-1 text-primary-foreground">
            Atualizar agora
          </button>
        </div>
      ) : null}
      {children}
    </>
  );
}
