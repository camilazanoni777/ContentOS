import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { classifyError, testConnection } from "./connection-diagnostic";
import { DataAccessError } from "@/lib/data/errors";

describe("connection-diagnostic — classificação de falhas de conexão", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("classifica status 401 e 403 como sessão expirada e conduz para /login", () => {
    const res401 = classifyError(new Error("Unauthorized"), 401);
    expect(res401.state).toBe("session_expired");
    expect(res401.actionHref).toBe("/login");
    expect(res401.canRetry).toBe(false);

    const res403 = classifyError(new Error("Forbidden"), 403);
    expect(res403.state).toBe("session_expired");
    expect(res403.actionHref).toBe("/login");
  });

  it("classifica como offline real quando navigator.onLine é false", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    const res = classifyError(new Error("Qualquer erro"));
    expect(res.state).toBe("offline_device");
    expect(res.title).toBe("Você está offline");
  });

  it("classifica DataAccessError e HTTP 500 como backend_error (Supabase)", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });

    const dbErr = classifyError(new DataAccessError("Failed to fetch records"));
    expect(dbErr.state).toBe("backend_error");
    expect(dbErr.title).toContain("banco de dados");

    const http500 = classifyError(new Error("Internal error"), 500);
    expect(http500.state).toBe("backend_error");
  });

  it("diferencia servidor indisponível de offline real quando navigator.onLine é true", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });

    const fetchErr = classifyError(new TypeError("Failed to fetch"));
    expect(fetchErr.state).toBe("server_unreachable");
    expect(fetchErr.title).toBe("Servidor indisponível");
    expect(fetchErr.message).toContain("3001");
  });

  it("testConnection retorna online quando o health check responde 200", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const res = await testConnection();
    expect(res.state).toBe("online");
    expect(res.title).toBe("Conectado");
  });

  it("testConnection retorna offline_device imediatamente se navigator.onLine for false", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const res = await testConnection();
    expect(res.state).toBe("offline_device");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
