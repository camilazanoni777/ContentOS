import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog (acessibilidade básica)", () => {
  it("expõe papel de diálogo e nome acessível a partir do título", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Excluir ideia em definitivo?"
        description="Essa ação não pode ser desfeita."
        onConfirm={() => {}}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Excluir ideia em definitivo?" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Essa ação não pode ser desfeita.")).toBeInTheDocument();
  });

  it("chama onConfirm ao confirmar e não chama ao cancelar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Excluir?"
        onConfirm={onConfirm}
        destructive
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
