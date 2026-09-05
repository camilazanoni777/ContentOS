import { describe, expect, it, vi, beforeEach } from "vitest";
import HomePage from "./page";

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const getUserMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

describe("Página inicial (/) — Redirecionamento dinâmico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
  });

  it("redireciona para /hoje quando o usuário está autenticado", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "cami@exemplo.com" } },
    });

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/hoje");
    expect(redirectMock).toHaveBeenCalledWith("/hoje");
  });

  it("redireciona para /login quando não há usuário autenticado", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: null },
    });

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redireciona para /login com segurança quando o cliente Supabase falha", async () => {
    createClientMock.mockRejectedValueOnce(new Error("Supabase indisponível"));

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
