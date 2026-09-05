import { z } from "zod";

import { CONTENT_STATUS_ORDER } from "@/types/domain";

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

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const contentItemFormSchema = z.object({
  title: z.string().trim().min(1, "Dê um título para a ideia.").max(200, "Título muito longo."),
  hook: optionalText(500, "Gancho muito longo."),
  summary: optionalText(2000, "Resumo muito longo."),
  pillar: optionalText(80, "Pilar muito longo."),
  format: optionalText(40, "Formato inválido."),
  objective: optionalText(60, "Objetivo inválido."),
  referenceText: optionalText(1000, "Referência muito longa."),
  referenceUrl: z.string().trim().max(2000).refine(
    (value) => value === "" || /^https?:\/\//i.test(value),
    "Use uma URL começando com http:// ou https://.",
  ),
  potential: optionalText(20, "Potencial inválido."),
  productionEase: optionalText(20, "Facilidade inválida."),
  priority: optionalText(20, "Prioridade inválida."),
  status: z.enum(CONTENT_STATUS_ORDER),
  canBeSeries: z.boolean(),
  seriesId: z.string().uuid().nullable().optional(),
  audienceIntent: optionalText(1000, "Público/intenção muito longo."),
  cta: optionalText(500, "CTA muito longo."),
  notes: optionalText(3000, "Observações muito longas."),
  tags: z.array(z.string().trim().min(1).max(40)).max(20, "Use no máximo 20 tags."),
});

export type ContentItemFormInput = z.infer<typeof contentItemFormSchema>;
