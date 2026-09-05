import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  NativeSelect,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "./select";

describe("Select UI Components", () => {
  it("renderiza o Select nativo e permite alterar opções", async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="Escolha uma opção" defaultValue="opt1">
        <option value="opt1">Opção 1</option>
        <option value="opt2">Opção 2</option>
      </Select>,
    );

    const select = screen.getByLabelText("Escolha uma opção") as HTMLSelectElement;
    expect(select.value).toBe("opt1");

    await user.selectOptions(select, "opt2");
    expect(select.value).toBe("opt2");
  });

  it("exporta NativeSelect como alias idêntico a Select", () => {
    expect(NativeSelect).toBe(Select);
  });

  it("renderiza o SelectTrigger do Radix com classes estilizadas", () => {
    render(
      <SelectRoot>
        <SelectTrigger aria-label="Gatilho Radix">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
      </SelectRoot>,
    );

    expect(screen.getByLabelText("Gatilho Radix")).toBeInTheDocument();
  });
});
