import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAutosave } from "./use-autosave";

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("não salva no primeiro render (valor inicial já é o que está salvo)", async () => {
    const save = vi.fn().mockResolvedValue({ success: true });
    renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "inicial" } },
    });

    await advance(1000);
    expect(save).not.toHaveBeenCalled();
  });

  it("salva depois do debounce quando o valor muda", async () => {
    const save = vi.fn().mockResolvedValue({ success: true });
    const { rerender } = renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "inicial" } },
    });

    act(() => rerender({ value: { title: "editado" } }));
    expect(save).not.toHaveBeenCalled(); // ainda dentro do debounce

    await advance(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: "editado" });
  });

  it("reinicia o debounce a cada mudança — só salva o valor mais recente, nunca perde texto digitado", async () => {
    const save = vi.fn().mockResolvedValue({ success: true });
    const { rerender } = renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "a" } },
    });

    act(() => rerender({ value: { title: "ab" } }));
    await advance(300);
    act(() => rerender({ value: { title: "abc" } }));
    await advance(300);
    act(() => rerender({ value: { title: "abcd" } }));
    await advance(500);

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: "abcd" });
  });

  it("reporta status de erro quando a Server Action retorna { error }, sem perder o valor pendente", async () => {
    const save = vi.fn().mockResolvedValue({ error: "Falha ao salvar." });
    const { result, rerender } = renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "a" } },
    });

    act(() => rerender({ value: { title: "ab" } }));
    await advance(500);

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Falha ao salvar.");
  });

  it("dirty começa false — o valor inicial já veio salvo do servidor", async () => {
    const save = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "inicial" } },
    });

    expect(result.current.dirty).toBe(false);
  });

  it("dirty vira true assim que o valor muda, antes mesmo do debounce salvar (usado pela prevenção de perda ao sair)", async () => {
    const save = vi.fn().mockResolvedValue({ success: true });
    const { result, rerender } = renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "a" } },
    });

    act(() => rerender({ value: { title: "ab" } }));
    expect(result.current.dirty).toBe(true);
  });

  it("dirty volta a false depois que o autosave salva com sucesso", async () => {
    const save = vi.fn().mockResolvedValue({ success: true });
    const { result, rerender } = renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "a" } },
    });

    act(() => rerender({ value: { title: "ab" } }));
    await advance(500);

    expect(result.current.dirty).toBe(false);
  });

  it("dirty continua true quando o salvamento falha — não é seguro fechar a aba", async () => {
    const save = vi.fn().mockResolvedValue({ error: "Falha ao salvar." });
    const { result, rerender } = renderHook(({ value }) => useAutosave({ value, save, delay: 500 }), {
      initialProps: { value: { title: "a" } },
    });

    act(() => rerender({ value: { title: "ab" } }));
    await advance(500);

    expect(result.current.dirty).toBe(true);
  });
});
