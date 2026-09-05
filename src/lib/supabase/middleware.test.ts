import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mocka o cliente Supabase server-side usado pelo middleware: controlamos
// diretamente o valor de `user` retornado por `auth.getUser()` para simular
// sessão presente/ausente sem depender de um projeto Supabase real.
const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

import { updateSession } from "./middleware";

const ENV_URL = "https://example.supabase.co";
const ENV_ANON = "anon-key-de-teste";

function makeRequest(pathname: string, search = "") {
  return new NextRequest(new Request(`https://app.test${pathname}${search}`));
}

describe("middleware de sessão — proteção de rotas (Prompt 14, cenário obrigatório #1)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ENV_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ENV_ANON);
    getUserMock.mockReset();
  });

  it("redireciona para /login com ?proximo= quando não há sessão e a rota é protegida", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await updateSession(makeRequest("/hoje"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("proximo")).toBe("/hoje");
  });

  it("deixa passar sem sessão em rotas públicas (/, /login, /offline, /auth/callback)", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    for (const path of ["/", "/login", "/offline", "/auth/callback", "/auth/auth-code-error", "/api/health"]) {
      const response = await updateSession(makeRequest(path));
      expect(response.status).toBe(200);
    }
  });

  it("deixa passar em rota protegida quando há sessão válida", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await updateSession(makeRequest("/hoje"));

    expect(response.status).toBe(200);
  });

  it("redireciona usuária já autenticada para /hoje ao tentar acessar /login novamente", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await updateSession(makeRequest("/login"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/hoje");
    expect(location.search).toBe("");
  });

  it("não bloqueia nenhuma rota quando o Supabase não está configurado (ambiente inicial)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const response = await updateSession(makeRequest("/hoje"));

    expect(response.status).toBe(200);
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
