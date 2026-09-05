import { describe, expect, it, vi, beforeEach } from "vitest";
import OnboardingPage from "./page";

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const getUserMock = vi.fn();
const createClientMock = vi.fn();
const listInstagramAccountsMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/data/instagram-accounts", () => ({
  listInstagramAccounts: (...args: unknown[]) => listInstagramAccountsMock(...args),
}));

vi.mock("@/features/onboarding/onboarding-wizard", () => ({
  OnboardingWizard: () => <div data-testid="onboarding-wizard" />,
}));

describe("OnboardingPage (/onboarding) — Redirecionamento e proteção", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
  });

  it("redireciona para /login?proximo=/onboarding quando não há sessão", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT:/login?proximo=/onboarding");
    expect(redirectMock).toHaveBeenCalledWith("/login?proximo=/onboarding");
  });

  it("redireciona para /hoje quando o usuário já possui conta de Instagram cadastrada", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });
    listInstagramAccountsMock.mockResolvedValueOnce([{ id: "acc-1", handle: "camilazanoni" }]);

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT:/hoje");
    expect(redirectMock).toHaveBeenCalledWith("/hoje");
  });

  it("permite renderizar o wizard quando o usuário não possui contas de Instagram", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-123" } } });
    listInstagramAccountsMock.mockResolvedValueOnce([]);

    const result = await OnboardingPage();
    expect(result).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
