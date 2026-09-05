import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { PwaProvider } from "./pwa-provider";

describe("PwaProvider — comportamento do Service Worker e limpeza", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("em desenvolvimento não registra SW, desregistra os existentes e purga apenas caches cami-*", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const unregisterMock = vi.fn().mockResolvedValue(true);
    const registerMock = vi.fn().mockResolvedValue({});
    const deleteCacheMock = vi.fn().mockResolvedValue(true);

    Object.defineProperty(globalThis, "navigator", {
      value: {
        onLine: true,
        serviceWorker: {
          register: registerMock,
          getRegistrations: vi.fn().mockResolvedValue([{ unregister: unregisterMock }]),
        },
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, "caches", {
      value: {
        keys: vi.fn().mockResolvedValue(["cami-shell-v1", "other-app-cache", "cami-data"]),
        delete: deleteCacheMock,
      },
      configurable: true,
      writable: true,
    });

    render(
      <PwaProvider>
        <div>App em dev</div>
      </PwaProvider>,
    );

    await waitFor(() => {
      expect(registerMock).not.toHaveBeenCalled();
      expect(unregisterMock).toHaveBeenCalled();
      expect(deleteCacheMock).toHaveBeenCalledWith("cami-shell-v1");
      expect(deleteCacheMock).toHaveBeenCalledWith("cami-data");
      expect(deleteCacheMock).not.toHaveBeenCalledWith("other-app-cache");
    });
  });

  it("em produção registra o /sw.js", async () => {
    vi.stubEnv("NODE_ENV", "production");

    // Mock hostname to a production domain so isDev is false
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        hostname: "contentos.app",
      },
      configurable: true,
      writable: true,
    });

    const registerMock = vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
    });

    Object.defineProperty(globalThis, "navigator", {
      value: {
        onLine: true,
        serviceWorker: {
          register: registerMock,
        },
      },
      configurable: true,
      writable: true,
    });

    render(
      <PwaProvider>
        <div>App em prod</div>
      </PwaProvider>,
    );

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith("/sw.js");
    });
  });

  it("exibe faixa de aviso quando o dispositivo está offline", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        onLine: false,
      },
      configurable: true,
      writable: true,
    });

    render(
      <PwaProvider>
        <div>Conteúdo</div>
      </PwaProvider>,
    );

    expect(
      screen.getByText(/Você está sem conexão de rede/i),
    ).toBeInTheDocument();
  });
});
