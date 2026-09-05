import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Você está offline — Cami Content OS",
};

/**
 * Página estática de fallback offline, servida pelo Service Worker
 * (public/sw.js) quando uma navegação falha por falta de conexão — nunca
 * quando o servidor responde normalmente. Não busca nem exibe nenhum dado
 * pessoal/autenticado: só informa a situação com honestidade e como
 * retomar. Ver PWA em CLAUDE.md.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-serif text-2xl font-semibold">Você está sem conexão</h1>
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar esta página porque o dispositivo está offline. Nenhuma
        alteração é salva enquanto você estiver sem internet — o Cami Content OS não
        guarda rascunhos para sincronizar depois.
      </p>
      <p className="text-sm text-muted-foreground">
        Assim que a conexão voltar, tente novamente.
      </p>
      <a
        href="/hoje"
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Tentar novamente
      </a>
    </div>
  );
}
