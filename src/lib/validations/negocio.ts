import { z } from "zod";
import { CAMPAIGN_PAYMENT_STATUSES, CAMPAIGN_TYPES, CONTRACT_STATUSES, DELIVERY_STATUSES, INSTALLMENT_STATUSES, NEGOTIATION_STATUSES, PRODUCT_STATUSES } from "@/lib/negocio";

const optionalText = (max = 2000) => z.string().trim().max(max).optional().or(z.literal("")).transform((value) => value || null);
const optionalUrl = (max = 1000) =>
  z.string().trim().max(max).optional().or(z.literal(""))
    .refine((value) => !value || /^https?:\/\//i.test(value), "Use uma URL começando com http:// ou https://.")
    .transform((value) => value || null);
const optionalDate = z.string().trim().max(10).optional().or(z.literal("")).transform((value) => value || null);
const optionalDateTime = z.string().trim().max(40).optional().or(z.literal("")).transform((value) => value || null);
const optionalDecimal = z.string().trim().max(20).refine((value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value), "Use um valor maior ou igual a zero, com até 2 casas decimais.").transform((value) => value === "" ? null : Number(value));
const optionalCount = z.string().trim().max(20).refine((value) => value === "" || /^\d+$/.test(value), "Use um número inteiro maior ou igual a zero.").transform((value) => value === "" ? null : Number(value));
const idOrNull = optionalText(100);

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da campanha.").max(200), brandName: optionalText(200),
  campaignType: z.enum(CAMPAIGN_TYPES), accountId: idOrNull, contactName: optionalText(200), contactEmail: optionalText(320),
  contactPhone: optionalText(50), contactNotes: optionalText(), firstContactDate: optionalDate, deliveryDueDate: optionalDate,
  publishedAt: optionalDateTime, contractedFee: optionalDecimal, currency: z.string().trim().length(3).transform((v) => v.toUpperCase()),
  negotiationStatus: z.enum(NEGOTIATION_STATUSES), contractStatus: z.enum(CONTRACT_STATUSES), deliveryStatus: z.enum(DELIVERY_STATUSES),
  paymentStatus: z.enum(CAMPAIGN_PAYMENT_STATUSES), expectedPaymentDate: optionalDate, briefingUrl: optionalUrl(1000), contractUrl: optionalUrl(1000),
  folderUrl: optionalUrl(1000), publicationUrl: optionalUrl(1000), responsibleName: optionalText(200), notes: optionalText(5000),
});

export const deliverableSchema = z.object({ campaignId: z.string().uuid(), contentItemId: idOrNull, title: z.string().trim().min(1, "Informe o entregável.").max(300), quantity: z.coerce.number().int().positive(), status: z.enum(["pending", "in_progress", "sent_for_approval", "approved", "published", "canceled"]), dueDate: optionalDate, notes: optionalText() });

export const paymentSchema = z.object({ campaignId: z.string().uuid(), amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Informe o valor da parcela.").transform(Number), receivedAmount: optionalDecimal, dueDate: optionalDate, receivedAt: optionalDateTime, status: z.enum(INSTALLMENT_STATUSES), notes: optionalText() }).superRefine((data, ctx) => {
  if (data.receivedAmount !== null && data.receivedAmount > data.amount) ctx.addIssue({ code: "custom", path: ["receivedAmount"], message: "O valor recebido não pode superar a parcela." });
  if (["paid", "partially_paid"].includes(data.status) && (!data.receivedAt || data.receivedAmount === null)) ctx.addIssue({ code: "custom", path: ["receivedAmount"], message: "Informe valor e data do recebimento." });
  if (data.status === "paid" && data.receivedAmount !== data.amount) ctx.addIssue({ code: "custom", path: ["receivedAmount"], message: "Parcela paga deve ter o valor total recebido." });
});

export const productSchema = z.object({ name: z.string().trim().min(1, "Informe o nome do produto.").max(200), status: z.enum(PRODUCT_STATUSES), referencePrice: optionalDecimal, notes: optionalText(5000) });

export const salesRecordSchema = z.object({
  productId: z.string().uuid(), campaignId: idOrNull, contentItemId: idOrNull, source: z.enum(["manual", "metric_snapshot"]),
  metricSnapshotId: idOrNull, saleDate: z.string().trim().min(1, "Informe a data."), cta: optionalText(300),
  linkClicks: optionalCount, leads: optionalCount, salesCount: optionalCount, revenue: optionalDecimal, notes: optionalText(),
}).superRefine((data, ctx) => {
  if (data.source === "metric_snapshot" && !data.metricSnapshotId) ctx.addIssue({ code: "custom", path: ["metricSnapshotId"], message: "Selecione a captura de métricas." });
});
