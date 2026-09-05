import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

/** Validação de criar/editar uma data importante do calendário editorial. */
export const calendarImportantDateSchema = z.object({
  eventDate: z.string().trim().min(1, "Informe a data.").max(10, "Data inválida."),
  label: z.string().trim().min(1, "Dê um nome para essa data.").max(200, "Nome muito longo."),
  notes: optionalText(1000, "Notas muito longas."),
});

export type CalendarImportantDateInput = z.infer<typeof calendarImportantDateSchema>;
