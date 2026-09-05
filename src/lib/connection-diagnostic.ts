import { DataAccessError } from "@/lib/data/errors";

export type ConnectionState =
  | "online"
  | "offline_device"
  | "server_unreachable"
  | "backend_error"
  | "session_expired"
  | "unexpected_error";

export interface DiagnosticResult {
  state: ConnectionState;
  title: string;
  message: string;
  actionText: string;
  actionHref?: string;
  canRetry: boolean;
  httpStatus?: number;
}

/**
 * Classifica um erro ocorrido na aplicação para evitar que qualquer falha
 * de rede ou API seja indevidamente classificada como "dispositivo offline".
 */
export function classifyError(error: unknown, status?: number): DiagnosticResult {
  // 1. Sessão expirada ou sem autorização (401 / 403)
  if (status === 401 || status === 403) {
    return {
      state: "session_expired",
      title: "Sessão expirada ou não autenticada",
      message: "Sua sessão precisa ser renovada para continuar utilizando o Content OS.",
      actionText: "Fazer login",
      actionHref: "/login",
      canRetry: false,
      httpStatus: status,
    };
  }

  // 2. Dispositivo comprovadamente sem conexão física de rede (navigator.onLine === false)
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      state: "offline_device",
      title: "Você está offline",
      message: "O dispositivo está desconectado da internet. Conecte-se ao Wi-Fi ou rede celular para continuar.",
      actionText: "Tentar novamente",
      canRetry: true,
    };
  }

  // 3. Falha na camada de dados / Supabase (DataAccessError ou 500/502/503/504)
  if (error instanceof DataAccessError || (status !== undefined && status >= 500 && status <= 504)) {
    return {
      state: "backend_error",
      title: "Instabilidade nos serviços do banco de dados",
      message:
        "O servidor está ativo, mas o Supabase encontrou uma falha temporária ao consultar ou gravar dados.",
      actionText: "Tentar novamente",
      canRetry: true,
      httpStatus: status,
    };
  }

  // 4. Erro de rede clássico (Failed to fetch / Connection refused / NetworkError)
  // Se navigator.onLine é true (ou indefinido), o dispositivo TEM internet, mas o host não respondeu
  const errorMessage = error instanceof Error ? error.message : String(error ?? "");
  const isNetworkFailure =
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("fetch failed");

  if (isNetworkFailure) {
    // Se o dispositivo estiver offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return {
        state: "offline_device",
        title: "Você está offline",
        message: "O dispositivo está desconectado da internet. Conecte-se ao Wi-Fi ou rede celular.",
        actionText: "Tentar novamente",
        canRetry: true,
      };
    }

    // Se o dispositivo está online mas o fetch falhou, é o servidor local ou porta parada
    return {
      state: "server_unreachable",
      title: "Servidor indisponível",
      message:
        "O dispositivo possui internet ativa, mas o servidor local (porta 3001) não está respondendo. Verifique se o processo está em execução.",
      actionText: "Tentar novamente",
      canRetry: true,
    };
  }

  // 5. Erro inesperado da aplicação
  return {
    state: "unexpected_error",
    title: "Algo deu errado",
    message: errorMessage || "Ocorreu um erro inesperado na aplicação. Tente recarregar a tela.",
    actionText: "Tentar novamente",
    canRetry: true,
    httpStatus: status,
  };
}

/**
 * Executa uma verificação real de conectividade via ping HTTP para /api/health
 * com cache desativado.
 */
export async function testConnection(timeoutMs = 4000): Promise<DiagnosticResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      state: "offline_device",
      title: "Você está offline",
      message: "O dispositivo está desconectado da internet. Verifique seu Wi-Fi ou cabo de rede.",
      actionText: "Tentar novamente",
      canRetry: true,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`/api/health?_t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.ok) {
      return {
        state: "online",
        title: "Conectado",
        message: "A conexão com o servidor foi restabelecida com sucesso.",
        actionText: "Prosseguir",
        canRetry: false,
        httpStatus: res.status,
      };
    }

    return classifyError(new Error(`HTTP ${res.status}`), res.status);
  } catch (err: unknown) {
    return classifyError(err);
  }
}
