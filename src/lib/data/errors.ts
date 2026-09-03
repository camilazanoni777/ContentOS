/**
 * Erro lançado por qualquer função da camada de acesso a dados quando o
 * Supabase retorna um erro. Centraliza o tratamento em vez de espalhar
 * checagens de `{ error }` por todos os componentes.
 */
export class DataAccessError extends Error {
  readonly cause?: unknown;
  readonly code?: string;

  constructor(message: string, options?: { cause?: unknown; code?: string }) {
    super(message);
    this.name = "DataAccessError";
    this.cause = options?.cause;
    this.code = options?.code;
  }
}

/**
 * Desembrulha o resultado `{ data, error }` do Supabase: retorna `data` em
 * caso de sucesso, ou lança um DataAccessError em caso de erro. Pensado para
 * funcionar tanto com try/catch simples quanto como `queryFn` do
 * TanStack Query (que trata qualquer exceção lançada como estado de erro).
 */
export function unwrap<T>(result: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (result.error) {
    throw new DataAccessError(result.error.message, { cause: result.error, code: result.error.code });
  }
  if (result.data === null) {
    throw new DataAccessError("Nenhum dado retornado pelo Supabase.");
  }
  return result.data;
}

/**
 * Igual a unwrap(), mas aceita `data: null` como resultado válido (ex.:
 * quando o registro buscado não existe — não é necessariamente um erro).
 */
export function unwrapNullable<T>(result: { data: T | null; error: { message: string; code?: string } | null }): T | null {
  if (result.error) {
    throw new DataAccessError(result.error.message, { cause: result.error, code: result.error.code });
  }
  return result.data;
}
