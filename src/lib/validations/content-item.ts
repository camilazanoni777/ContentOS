import { z } from "zod";

/**
 * Validação da captura rápida de ideia (QuickCaptureButton/Drawer): só o
 * título é obrigatório, conforme o produto pede ("< 20s para salvar uma
 * ideia"). Os demais campos completos de content_items ficam para o
 * formulário completo, numa fase futura.
 */
export const quickIdeaSchema = z.object({
  title: z.string().trim().min(1, "Dê um título para a ideia.").max(200, "Título muito longo."),
  hook: z.string().trim().max(280, "Gancho muito longo.").optional().or(z.literal("")),
  pillar: z.string().trim().max(80, "Pilar muito longo.").optional().or(z.literal("")),
  referenceText: z.string().trim().max(280, "Referência muito longa.").optional().or(z.literal("")),
});

export type QuickIdeaInput = z.infer<typeof quickIdeaSchema>;
