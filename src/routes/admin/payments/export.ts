import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Context } from "hono";
import z from "zod";
import { listPaymentsForExport } from "@/operations/payments";

interface ExportPaymentsHandlerParams extends ExportPaymentsParams {
  organizationId: string;
}

export const exportPaymentsSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .superRefine((value, ctx) => {
    if (value.from > value.to) {
      ctx.addIssue({
        code: "custom",
        message:
          "La data finale deve essere maggiore o uguale alla data iniziale",
        path: ["to"],
      });
    }
  });

export type ExportPaymentsParams = z.infer<typeof exportPaymentsSchema>;

const regex = /[",\n\r]/;
function escapeCsvValue(value: string) {
  if (regex.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function formatCsvDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return format(value, "dd/MM/yyyy HH:mm", { locale: it });
}

function getPaymentModeLabel(mode: string | null | undefined) {
  if (!mode) {
    return "";
  }

  const labels = {
    check: "Assegno",
    cash: "Contanti",
    bank_transfer: "Bonifico bancario",
    debit_card: "Carta di debito",
  } as const;

  return labels[mode as keyof typeof labels] ?? mode;
}

function getPaymentStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "";
  }

  const labels = {
    pending: "In attesa",
    completed: "Completato",
    failed: "Fallito",
  } as const;

  return labels[status as keyof typeof labels] ?? status;
}

export async function exportPayments(
  c: Context,
  params: ExportPaymentsHandlerParams
) {
  const { organizationId, from, to } = params;

  const { payments } = await listPaymentsForExport(organizationId, {
    from,
    to,
  });

  const headers = [
    "id",
    "azienda",
    "importo",
    "valuta",
    "metodo_pagamento",
    "stato",
    "pagato_il",
    "scadenza",
    "creato_il",
  ];

  const csvLines = [
    headers.join(","),
    ...payments.map((payment) =>
      [
        payment.id,
        payment.customerBusinessName ?? "",
        payment.amount,
        payment.currency,
        getPaymentModeLabel(payment.paymentMode),
        getPaymentStatusLabel(payment.status),
        formatCsvDate(payment.paidAt),
        formatCsvDate(payment.expiresAt),
        formatCsvDate(payment.createdAt),
      ]
        .map((value) => escapeCsvValue(String(value)))
        .join(",")
    ),
  ];

  const fromLabel = from.toISOString().slice(0, 10);
  const toLabel = to.toISOString().slice(0, 10);
  const fileName = `pagamenti-${fromLabel}-${toLabel}.csv`;

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="${fileName}"`);

  return c.body(`\uFEFF${csvLines.join("\n")}`);
}
