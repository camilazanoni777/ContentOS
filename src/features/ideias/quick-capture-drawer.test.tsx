import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createQuickContentIdeaMock = vi.fn();

vi.mock("@/lib/actions/content-items", () => ({
  createQuickContentIdea: (...args: unknown[]) => createQuickContentIdeaMock(...args),
}));

import { QuickCaptureDrawer } from "./quick-capture-drawer";

describe("QuickCaptureDrawer", () => {
  it("exige título e não chama a Server Action sem ele", async () => {
    const user = userEvent.setup();
    render(<QuickCaptureDrawer open={true} onOpenChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Salvar ideia" }));

    expect(await screen.findByText("Dê um título para a ideia.")).toBeInTheDocument();
    expect(createQuickContentIdeaMock).not.toHaveBeenCalled();
  });

  it("salva a ideia só com o título preenchido (demais campos opcionais)", async () => {
    createQuickContentIdeaMock.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();
    render(<QuickCaptureDrawer open={true} onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText(/Título/), "Bastidores da gravação");
    await user.click(screen.getByRole("button", { name: "Salvar ideia" }));

    await waitFor(() => expect(createQuickContentIdeaMock).toHaveBeenCalledTimes(1));
    expect(createQuickContentIdeaMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Bastidores da gravação" }),
    );
    expect(await screen.findByText("Ideia salva!")).toBeInTheDocument();
  });

  it("mostra o erro devolvido pela Server Action sem fechar o formulário", async () => {
    createQuickContentIdeaMock.mockResolvedValueOnce({ error: "Sua sessão expirou. Entre novamente para salvar a ideia." });
    const user = userEvent.setup();
    render(<QuickCaptureDrawer open={true} onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText(/Título/), "Ideia qualquer");
    await user.click(screen.getByRole("button", { name: "Salvar ideia" }));

    expect(await screen.findByText("Sua sessão expirou. Entre novamente para salvar a ideia.")).toBeInTheDocument();
  });
});
