"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Um QueryClient por sessão de navegador (não por request), seguindo a
 * recomendação do TanStack Query para o App Router: cria a instância dentro
 * de um useState para não compartilhar cache entre usuários/requests no
 * servidor, mas manter uma única instância estável no cliente.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Servidor: sempre um client novo.
    return makeQueryClient();
  }
  // Navegador: reaproveita a mesma instância entre renders.
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
