import type { InferSelectModel } from "drizzle-orm";
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  or,
} from "drizzle-orm";
import database from "@/db";
import { customer, organization, payment, paymentLineItem } from "@/db/schema";
import type { CreatePaymentInput } from "@/routes/admin/payments/create";
import type { ListPaymentsParams } from "@/routes/admin/payments/list";
import type { UpdatePaymentInput } from "@/routes/admin/payments/update";

type CreatePaymentOperationInput = CreatePaymentInput & {
  status: "pending" | "completed";
};

type PaymentLineItemOperationInput = CreatePaymentInput["lineItems"][number];

const publicPaymentColumns = {
  id: payment.id,
  organizationId: payment.organizationId,
  customerId: payment.customerId,
  orderId: payment.orderId,
  paymentMode: payment.paymentMode,
  amount: payment.amount,
  currency: payment.currency,
  status: payment.status,
  createdAt: payment.createdAt,
  organizationName: organization.name,
  customerBusinessName: customer.businessName,
};

function getLineItemsTotalAmount(
  lineItems: PaymentLineItemOperationInput[]
): string {
  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);
  return total.toString();
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildPaymentLineItemValues(
  paymentId: string,
  lineItems: PaymentLineItemOperationInput[]
) {
  return lineItems.map((lineItem, index) => ({
    paymentId,
    position: index,
    documentType: lineItem.documentType,
    documentId: lineItem.documentId.trim(),
    amount: lineItem.amount.toString(),
    imageUrl: normalizeNullableText(lineItem.imageUrl),
  }));
}

async function getPaymentLineItemsByPaymentIds(paymentIds: string[]) {
  const itemsByPaymentId = new Map<
    string,
    InferSelectModel<typeof paymentLineItem>[]
  >();

  if (paymentIds.length === 0) {
    return itemsByPaymentId;
  }

  const lineItems = await database
    .select()
    .from(paymentLineItem)
    .where(inArray(paymentLineItem.paymentId, paymentIds))
    .orderBy(asc(paymentLineItem.position), asc(paymentLineItem.createdAt));

  for (const lineItem of lineItems) {
    const existing = itemsByPaymentId.get(lineItem.paymentId) ?? [];
    existing.push(lineItem);
    itemsByPaymentId.set(lineItem.paymentId, existing);
  }

  return itemsByPaymentId;
}

/**
 * Get a payment by id (scoped to organization)
 */
export async function getPaymentById(
  paymentId: string,
  organizationId: string
) {
  const [row] = await database
    .select(publicPaymentColumns)
    .from(payment)
    .leftJoin(organization, eq(organization.id, payment.organizationId))
    .leftJoin(customer, eq(customer.id, payment.customerId))
    .where(
      and(eq(payment.id, paymentId), eq(payment.organizationId, organizationId))
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const lineItems = await database
    .select()
    .from(paymentLineItem)
    .where(eq(paymentLineItem.paymentId, paymentId))
    .orderBy(asc(paymentLineItem.position), asc(paymentLineItem.createdAt));

  return {
    ...row,
    lineItems,
  };
}

/**
 * List payments (scoped to organization)
 */
export async function listPayments(
  organizationId: string,
  params: ListPaymentsParams
) {
  const { page, perPage, search } = params;
  const sanitizedSearch = search?.trim() || undefined;

  const documentSearchFilter =
    sanitizedSearch && sanitizedSearch.length > 0
      ? exists(
          database
            .select({ id: paymentLineItem.id })
            .from(paymentLineItem)
            .where(
              and(
                eq(paymentLineItem.paymentId, payment.id),
                ilike(paymentLineItem.documentId, `%${sanitizedSearch}%`)
              )
            )
        )
      : undefined;

  const searchFilter =
    sanitizedSearch && sanitizedSearch.length > 0
      ? or(
          ilike(customer.businessName, `%${sanitizedSearch}%`),
          documentSearchFilter
        )
      : undefined;

  const whereClause = and(
    eq(payment.organizationId, organizationId),
    searchFilter
  );

  const [payments, [{ total }]] = await Promise.all([
    database
      .select(publicPaymentColumns)
      .from(payment)
      .leftJoin(organization, eq(organization.id, payment.organizationId))
      .leftJoin(customer, eq(customer.id, payment.customerId))
      .where(whereClause)
      .orderBy(desc(payment.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    database
      .select({ total: countDistinct(payment.id) })
      .from(payment)
      .leftJoin(organization, eq(organization.id, payment.organizationId))
      .leftJoin(customer, eq(customer.id, payment.customerId))
      .where(whereClause),
  ]);

  const paymentIds = payments.map((paymentRow) => paymentRow.id);
  const lineItemsByPaymentId =
    await getPaymentLineItemsByPaymentIds(paymentIds);

  return {
    payments: payments.map((paymentRow) => ({
      ...paymentRow,
      lineItems: lineItemsByPaymentId.get(paymentRow.id) ?? [],
    })),
    total,
  };
}

/**
 * Create a payment (organization id is always taken from authenticated context)
 */
export async function createPayment(
  organizationId: string,
  input: CreatePaymentOperationInput
) {
  const totalAmount = getLineItemsTotalAmount(input.lineItems);

  return await database.transaction(async (tx) => {
    const [created] = await tx
      .insert(payment)
      .values({
        organizationId,
        customerId: input.customerId,
        orderId: input.orderId ?? null,
        paymentMode: input.paymentMode,
        amount: totalAmount,
        currency: input.currency,
        status: input.status,
        expiresAt: input.expiresAt ?? null,
        paidAt: input.paidAt ?? null,
        createdAt: new Date(),
      })
      .returning();

    const createdLineItems = await tx
      .insert(paymentLineItem)
      .values(buildPaymentLineItemValues(created.id, input.lineItems))
      .returning();

    return {
      ...created,
      lineItems: createdLineItems,
    };
  });
}

/**
 * Update a payment (scoped to organization)
 */
export async function updatePayment(
  id: string,
  organizationId: string,
  input: UpdatePaymentInput
) {
  const [existing] = await database
    .select()
    .from(payment)
    .where(and(eq(payment.id, id), eq(payment.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    return null;
  }

  return await database.transaction(async (tx) => {
    const updates: Partial<InferSelectModel<typeof payment>> = {
      ...(input.customerId !== undefined && {
        customerId: input.customerId,
      }),
      ...(input.orderId !== undefined && {
        orderId: input.orderId,
      }),
      ...(input.paymentMode !== undefined && {
        paymentMode: input.paymentMode,
      }),
      ...(input.status !== undefined && {
        status: input.status,
      }),
      ...(input.lineItems !== undefined && {
        amount: getLineItemsTotalAmount(input.lineItems),
      }),
    };

    let currentPayment = existing;

    if (Object.keys(updates).length > 0) {
      const [updated] = await tx
        .update(payment)
        .set(updates)
        .where(
          and(eq(payment.id, id), eq(payment.organizationId, organizationId))
        )
        .returning();

      if (updated) {
        currentPayment = updated;
      }
    }

    if (input.lineItems !== undefined) {
      await tx.delete(paymentLineItem).where(eq(paymentLineItem.paymentId, id));

      const createdLineItems = await tx
        .insert(paymentLineItem)
        .values(buildPaymentLineItemValues(id, input.lineItems))
        .returning();

      return {
        ...currentPayment,
        lineItems: createdLineItems,
      };
    }

    const currentLineItems = await tx
      .select()
      .from(paymentLineItem)
      .where(eq(paymentLineItem.paymentId, id))
      .orderBy(asc(paymentLineItem.position), asc(paymentLineItem.createdAt));

    return {
      ...currentPayment,
      lineItems: currentLineItems,
    };
  });
}

/**
 * Delete a payment (scoped to organization)
 */
export async function deletePaymentById(
  paymentId: string,
  organizationId: string
) {
  const [deleted] = await database
    .delete(payment)
    .where(
      and(eq(payment.id, paymentId), eq(payment.organizationId, organizationId))
    )
    .returning();

  return deleted ?? null;
}

/**
 * Delete multiple payments (scoped to organization)
 */
export async function deletePaymentsByIds(
  paymentIds: string[],
  organizationId: string
) {
  const uniquePaymentIds = Array.from(new Set(paymentIds));

  if (uniquePaymentIds.length === 0) {
    return [];
  }

  return await database
    .delete(payment)
    .where(
      and(
        eq(payment.organizationId, organizationId),
        inArray(payment.id, uniquePaymentIds)
      )
    )
    .returning();
}
