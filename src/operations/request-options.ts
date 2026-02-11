import { and, eq, ne } from "drizzle-orm";
import database from "@/db";
import { request } from "@/db/schema/request/request";
import { requestOption } from "@/db/schema/request/request-option";

// ============================================================================
// Request Option Operations
// ============================================================================

export async function listRequestOptions(requestItemId: string) {
  return await database.query.requestOption.findMany({
    where: (o, { eq }) => eq(o.requestItemId, requestItemId),
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    with: {
      location: true,
    },
  });
}

export async function getRequestOptionById(id: string) {
  return await database.query.requestOption.findFirst({
    where: (o, { eq }) => eq(o.id, id),
    with: {
      location: true,
    },
  });
}

export async function selectRequestOption(id: string) {
  const [updated] = await database
    .update(requestOption)
    .set({
      selectedAt: new Date(),
      status: "selected",
    })
    .where(eq(requestOption.id, id))
    .returning();

  return updated ?? null;
}

export async function rejectRequestOption(id: string) {
  const [updated] = await database
    .update(requestOption)
    .set({
      status: "rejected",
    })
    .where(eq(requestOption.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Reject all options for a request item except the specified one.
 */
export async function rejectOtherOptionsForItem(
  requestItemId: string,
  exceptOptionId: string
) {
  await database
    .update(requestOption)
    .set({ status: "rejected" })
    .where(
      and(
        eq(requestOption.requestItemId, requestItemId),
        eq(requestOption.status, "pending"),
        ne(requestOption.id, exceptOptionId)
      )
    );
}

/**
 * Check if all request items have a selected option.
 * Returns true if every item has at least one option with status "selected".
 */
export async function allItemsHaveSelectedOption(
  requestId: string
): Promise<boolean> {
  const items = await database.query.requestItem.findMany({
    where: (i, { eq }) => eq(i.requestId, requestId),
    with: {
      options: true,
    },
  });

  if (items.length === 0) {
    return false;
  }

  return items.every((item) =>
    item.options.some((option) => option.status === "selected")
  );
}

interface SelectOptionAndFinalizeParams {
  requestId: string;
  itemId: string;
  optionId: string;
}

/**
 * Select an option and finalize the request if all items have selections.
 * Runs all writes in a transaction for atomicity.
 */
export async function selectOptionAndFinalize(
  params: SelectOptionAndFinalizeParams
) {
  const { requestId, itemId, optionId } = params;

  return await database.transaction(async (tx) => {
    // Select the option
    const [updated] = await tx
      .update(requestOption)
      .set({
        selectedAt: new Date(),
        status: "selected",
      })
      .where(eq(requestOption.id, optionId))
      .returning();

    // Reject all other pending options for this request item
    await tx
      .update(requestOption)
      .set({ status: "rejected" })
      .where(
        and(
          eq(requestOption.requestItemId, itemId),
          eq(requestOption.status, "pending"),
          ne(requestOption.id, optionId)
        )
      );

    // Check if all request items now have a selected option
    const items = await tx.query.requestItem.findMany({
      where: (i, { eq }) => eq(i.requestId, requestId),
      with: {
        options: true,
      },
    });

    const allSelected =
      items.length > 0 &&
      items.every((item) =>
        item.options.some((option) => option.status === "selected")
      );

    // If all items have selections, mark the request as approved
    if (allSelected) {
      await tx
        .update(request)
        .set({
          status: "approved",
          decidedAt: new Date(),
        })
        .where(eq(request.id, requestId));
    }

    return updated ?? null;
  });
}
