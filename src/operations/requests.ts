import { and, count, eq, type SQL } from "drizzle-orm";
import database from "@/db";
import { request } from "@/db/schema/request/request";
import type { CreateRequestInput } from "@/routes/web/requests/create";
import type { RequestStatus } from "@/types/rcp";

// ============================================================================
// Request Operations
// ============================================================================

export interface ListRequestsParams {
  page: number;
  perPage: number;
  status?: RequestStatus;
  organizationId?: string;
}

export async function listRequests(params: ListRequestsParams) {
  const { page, perPage, status, organizationId } = params;

  // Build where conditions for count query
  const conditions: SQL[] = [];
  if (status) {
    conditions.push(eq(request.status, status));
  }
  if (organizationId) {
    conditions.push(eq(request.organizationId, organizationId));
  }

  const totalQuery = database.select({ total: count() }).from(request);
  if (conditions.length > 0) {
    totalQuery.where(
      conditions.length === 1 ? conditions[0] : and(...conditions)
    );
  }

  const [requests, [{ total }]] = await Promise.all([
    database.query.request.findMany({
      where:
        status || organizationId
          ? (r, ops) => {
              if (status && organizationId) {
                return ops.and(
                  ops.eq(r.status, status),
                  ops.eq(r.organizationId, organizationId)
                );
              }
              if (status) {
                return ops.eq(r.status, status);
              }
              if (organizationId) {
                return ops.eq(r.organizationId, organizationId);
              }
              return;
            }
          : undefined,
      with: {
        organization: true,
        createdBy: true,
        requestedFor: true,
        handledBy: true,
        items: {
          with: {
            options: true,
          },
        },
        calendarEvents: true,
      },
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: (r, { desc, sql }) => [
        sql`CASE ${r.status}
          WHEN 'pending_approval' THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'approved' THEN 3
          WHEN 'confirmed' THEN 4
          WHEN 'cancelled' THEN 5
          ELSE 6
        END`,
        desc(r.createdAt),
      ],
    }),
    totalQuery,
  ]);

  return { requests, total };
}

export async function getRequestById(id: string) {
  return await database.query.request.findFirst({
    where: (r, { eq }) => eq(r.id, id),
    with: {
      organization: true,
      createdBy: true,
      requestedFor: true,
      handledBy: true,
      items: {
        orderBy: (i, { asc }) => [asc(i.sortOrder)],
        with: {
          options: {
            orderBy: (o, { desc }) => [desc(o.createdAt)],
            with: {
              location: true,
            },
          },
        },
      },
      calendarEvents: true,
    },
  });
}

export async function createRequest(input: CreateRequestInput) {
  const [created] = await database
    .insert(request)
    .values({
      organizationId: input.organizationId,
      createdByUserId: input.createdByUserId,
      requestedForUserId: input.requestedForUserId ?? null,
      type: input.type ?? "other",
      title: input.title,
      description: input.description ?? null,
    })
    .returning();

  return created;
}

export interface UpdateRequestInput {
  status?: string;
  handledByUserId?: string | null;
  title?: string;
  description?: string | null;
  type?: string;
  requestedForUserId?: string | null;
  sentForApprovalAt?: Date | null;
  decidedAt?: Date | null;
}

export async function updateRequest(id: string, input: UpdateRequestInput) {
  const [updated] = await database
    .update(request)
    .set(input as Partial<typeof request.$inferInsert>)
    .where(eq(request.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteRequest(id: string) {
  const [deleted] = await database
    .delete(request)
    .where(eq(request.id, id))
    .returning();

  return deleted ?? null;
}

// ============================================================================
// Request Item Operations
// ============================================================================

export async function listRequestItems(requestId: string) {
  return await database.query.requestItem.findMany({
    where: (i, { eq }) => eq(i.requestId, requestId),
    orderBy: (i, { asc }) => [asc(i.sortOrder)],
    with: {
      options: {
        orderBy: (o, { desc }) => [desc(o.createdAt)],
      },
    },
  });
}

export async function getRequestItemById(id: string) {
  return await database.query.requestItem.findFirst({
    where: (i, { eq }) => eq(i.id, id),
    with: {
      options: {
        orderBy: (o, { desc }) => [desc(o.createdAt)],
      },
    },
  });
}
