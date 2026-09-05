/**
 * Valores do formulário de sessão de gravação tal como o react-hook-form
 * manipula — tudo string (a conversão para null/number acontece só no
 * schema Zod do servidor, ver src/lib/validations/recording-session.ts).
 * Não é derivado de z.infer pelo mesmo motivo documentado em
 * script-form-types.ts (tipo de entrada vs. saída de `.transform()`).
 */
export interface RecordingSessionFormValues {
  sessionDate: string;
  location: string;
  scenario: string;
  outfit: string;
  equipment: string;
  availableMinutes: string;
  notes: string;
}
