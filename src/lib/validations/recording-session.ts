import { z } from "zod";

import { RECORDING_CHECKLIST_KEYS } from "@/types/domain";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

const optionalMinutes = z
  .string()
  .trim()
  .max(6, "Tempo disponível muito longo.")
  .refine((value) => value === "" || /^\d+$/.test(value), "Use só números (minutos).")
  .transform((value) => (value === "" ? null : Number(value)));

/** Validação do formulário de criação/edição de uma sessão de gravação em lote. */
export const recordingSessionSchema = z.object({
  sessionDate: optionalText(10, "Data inválida."),
  location: optionalText(200, "Local muito longo."),
  scenario: optionalText(200, "Cenário muito longo."),
  outfit: optionalText(200, "Roupa muito longa."),
  equipment: optionalText(500, "Equipamento muito longo."),
  availableMinutes: optionalMinutes,
  notes: optionalText(2000, "Observações muito longas."),
});

export type RecordingSessionInput = z.infer<typeof recordingSessionSchema>;

/** Objeto fixo com as 8 chaves do checklist de gravação — sempre presentes. */
export const recordingChecklistSchema = z.object(
  Object.fromEntries(RECORDING_CHECKLIST_KEYS.map((key) => [key, z.boolean()])) as Record<
    (typeof RECORDING_CHECKLIST_KEYS)[number],
    z.ZodBoolean
  >,
);
