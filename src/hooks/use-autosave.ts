"use client";

import * as React from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutosaveOptions<T> {
  /** Valor atual a ser salvo (tipicamente o retorno de `watch()` do react-hook-form). */
  value: T;
  /** Função que persiste o valor — deve retornar `{ error }` em caso de falha. */
  save: (value: T) => Promise<{ error: string } | { success: true } | Record<string, unknown>>;
  /** Debounce, em ms, entre a última mudança e o salvamento. */
  delay?: number;
  /** Enquanto false, nada é salvo (ex.: formulário ainda carregando valores iniciais). */
  enabled?: boolean;
}

/**
 * Autosave de rascunho com debounce: salva `value` `delay`ms depois da
 * última mudança, sem nunca perder o texto digitado (o valor pendente mais
 * recente é sempre o que acaba sendo salvo). Em erro, mantém tudo como está
 * e permite tentar de novo — nunca descarta o rascunho da usuária.
 *
 * `dirty` indica se há alteração ainda não confirmada como salva (inclui o
 * período "saving" e qualquer mudança feita desde o último sucesso) — usado
 * por telas com prevenção de perda ao sair (ex.: workspace de Roteiros).
 */
export function useAutosave<T>({ value, save, delay = 900, enabled = true }: UseAutosaveOptions<T>) {
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const valueKey = JSON.stringify(value);

  // `savedKey` espelha o último valor efetivamente salvo, só para calcular
  // `dirty` durante o render. Inicializado já com o valor atual: na
  // primeira renderização, o valor vem do servidor e já está salvo, então
  // não há necessidade de um efeito só para "zerar" isso depois do mount
  // (o que disparava o aviso de set-state-em-efeito do React Compiler).
  const [savedKey, setSavedKey] = React.useState(() => valueKey);
  // Espelho em ref do mesmo dado, para runSave decidir (fora do render) se
  // já está tudo salvo sem precisar recriar o callback a cada mudança.
  const lastSavedJsonRef = React.useRef(savedKey);

  // `save` é recriada a cada render (closure sobre props/estado do
  // formulário) — guardamos a versão mais recente numa ref sincronizada por
  // efeito, para o timeout de debounce sempre chamar a função atual sem
  // precisar recriar o efeito de agendamento a cada render.
  const saveRef = React.useRef(save);
  React.useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const isFirstRef = React.useRef(true);
  const savingRef = React.useRef(false);

  const runSave = React.useCallback(async (current: T, currentKey: string) => {
    if (savingRef.current || currentKey === lastSavedJsonRef.current) return;

    savingRef.current = true;
    setStatus("saving");
    setError(null);
    try {
      const result = await saveRef.current(current);
      if (result && "error" in result && typeof result.error === "string") {
        setStatus("error");
        setError(result.error);
      } else {
        lastSavedJsonRef.current = currentKey;
        setSavedKey(currentKey);
        setStatus("saved");
        setSavedAt(new Date());
      }
    } catch {
      setStatus("error");
      setError("Não foi possível salvar agora.");
    } finally {
      savingRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    if (isFirstRef.current) {
      // Não salva no primeiro render: os valores iniciais vêm do servidor
      // (já estão salvos), não são uma mudança da usuária.
      isFirstRef.current = false;
      return;
    }
    const handle = setTimeout(() => {
      void runSave(value, valueKey);
    }, delay);
    return () => clearTimeout(handle);
    // `value` é capturado pela closure do timeout; `valueKey` (seu conteúdo
    // serializado) é a dependência real do efeito — evita reagendar o
    // debounce em todo re-render quando `value` só muda de referência.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, enabled, delay, runSave]);

  const retry = React.useCallback(() => {
    void runSave(value, valueKey);
  }, [runSave, value, valueKey]);

  const dirty = valueKey !== savedKey;

  return { status, savedAt, error, retry, dirty };
}
