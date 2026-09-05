"use client";

import * as React from "react";

/**
 * Registra o Service Worker (public/sw.js) exclusivamente em produção e
 * garante a limpeza segura de caches residuais em desenvolvimento.
 *
 * Em desenvolvimento:
 *  - O Service Worker é desativado para evitar que caches antigos interceptem
 *    o Next.js Fast Refresh ou requisições na porta 3001.
 *  - Caches específicos do Cami Content OS ("cami-*") são purgados sem tocar
 *    em caches de outras origens ou aplicações.
 *
 * Em produção:
 *  - Registra o Service Worker e monitora atualizações controladas.
 *  - Exibe aviso honesto quando o dispositivo está offline (sem fila fantasma).
 */

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
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isDev =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local");

    if (isDev) {
      // 1. Em desenvolvimento: desregistra qualquer Service Worker prévio do app
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        })
        .catch(() => undefined);

      // 2. Limpa apenas os caches do Cami Content OS para não afetar outros projetos
      if ("caches" in window) {
        caches
          .keys()
          .then((names) => {
            for (const name of names) {
              if (name.startsWith("cami-")) {
                caches.delete(name);
              }
            }
          })
          .catch(() => undefined);
      }
      return;
    }

    // Em PRODUÇÃO: registra o Service Worker
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
        <div
          role="status"
          className="flex items-center justify-center gap-2 bg-[var(--tone-warning-bg)] px-4 py-2 text-center text-sm font-medium text-[var(--tone-warning-fg)] border-b border-[var(--tone-warning-border)]"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
          <span>Você está sem conexão de rede. Nenhuma alteração será salva até a internet voltar.</span>
        </div>
      ) : null}
      {waitingWorker ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 bg-secondary px-4 py-2 text-center text-sm text-secondary-foreground"
        >
          <span>Uma nova versão está disponível.</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          >
            Atualizar agora
          </button>
        </div>
      ) : null}
      {children}
    </>
  );
}
