import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import GlobalError from "./error";
import { DataAccessError } from "@/lib/data/errors";

describe("GlobalError — tratamento de erros da aplicação", () => {
  it("renderiza instabilidade do banco de dados quando ocorre DataAccessError", () => {
    const reset = vi.fn();
    const error = new DataAccessError("Supabase connection timeout");

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText(/banco de dados/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("renderiza botão de login quando status é 401/403", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("Unauthorized"), { digest: "401" });

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});
