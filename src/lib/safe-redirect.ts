/**
 * Só aceita caminhos internos relativos ("/algo"), nunca uma URL absoluta
 * ou "//host" (que o navegador trata como protocol-relative para outro
 * domínio) — evita um open redirect via parâmetros como ?next=/?proximo=
 * vindos de fora. Compartilhado entre o callback OAuth/magic-link e o
 * formulário de login (pós-login).
 */
export function safeNextPath(value: string | null | undefined, fallback = "/hoje"): string {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value;
  }
  return fallback;
}
