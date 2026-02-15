import type { InferSelectModel } from "drizzle-orm";
import {
  and,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
} from "drizzle-orm";
import database from "@/db";
import { customer, customerAddress, payment } from "@/db/schema";
import type { CreateCustomerInput } from "@/routes/admin/customers/create";
import type { CreateCustomerAddressInput } from "@/routes/admin/customers/create-address";
import type { ListCustomersParams } from "@/routes/admin/customers/list";
import type { UpdateCustomerInput } from "@/routes/admin/customers/update";
import type { UpdateCustomerAddressInput } from "@/routes/admin/customers/update-address";

const PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:\/\//i;
const TRAILING_DOT_REGEX = /\.$/;
const URL_PATH_SEPARATOR_REGEX = /[/?#]/;
const WHITESPACE_REGEX = /\s/;

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalCountryCode(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

function toDomain(value: string) {
  const hasProtocol = PROTOCOL_REGEX.test(value);
  const candidate = hasProtocol ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    const domain = parsed.hostname
      .trim()
      .toLowerCase()
      .replace(TRAILING_DOT_REGEX, "");
    return domain.length > 0 ? domain : null;
  } catch {
    const withoutProtocol = value.replace(PROTOCOL_REGEX, "");
    const hostWithAuthAndPort =
      withoutProtocol.split(URL_PATH_SEPARATOR_REGEX)[0] ?? "";
    const hostWithPort = hostWithAuthAndPort.split("@").pop() ?? "";
    const domain = hostWithPort
      .split(":")[0]
      ?.trim()
      .toLowerCase()
      .replace(TRAILING_DOT_REGEX, "");

    if (!domain || domain.length === 0 || WHITESPACE_REGEX.test(domain)) {
      return null;
    }

    return domain;
  }
}

function normalizeOptionalDomain(value: string | null | undefined) {
  const normalizedText = normalizeOptionalText(value);

  if (normalizedText === undefined || normalizedText === null) {
    return normalizedText;
  }

  return toDomain(normalizedText);
}

/**
 * List customers for an organization
 */
export async function listCustomers(
  organizationId: string,
  params: ListCustomersParams
) {
  const { page, perPage, search } = params;
  const sanitizedSearch = search?.trim() || undefined;

  const searchFilter =
    sanitizedSearch && sanitizedSearch.length > 0
      ? or(
          ilike(customer.businessName, `%${sanitizedSearch}%`),
          ilike(customer.clientCode, `%${sanitizedSearch}%`)
        )
      : undefined;

  const whereClause = and(
    eq(customer.organizationId, organizationId),
    searchFilter
  );

  const [customerRows, [{ total }]] = await Promise.all([
    database
      .select()
      .from(customer)
      .where(whereClause)
      .orderBy(desc(customer.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    database
      .select({ total: countDistinct(customer.id) })
      .from(customer)
      .where(whereClause),
  ]);

  if (customerRows.length === 0) {
    return { customers: [], total };
  }

  const customerIds = customerRows.map((item) => item.id);
  const addresses = await database
    .select()
    .from(customerAddress)
    .where(inArray(customerAddress.customerId, customerIds))
    .orderBy(desc(customerAddress.isPrimary), desc(customerAddress.createdAt));

  const addressesByCustomerId = new Map<
    string,
    InferSelectModel<typeof customerAddress>[]
  >();

  for (const address of addresses) {
    const existing = addressesByCustomerId.get(address.customerId) ?? [];
    existing.push(address);
    addressesByCustomerId.set(address.customerId, existing);
  }

  const customers = customerRows.map((item) => ({
    ...item,
    addresses: addressesByCustomerId.get(item.id) ?? [],
  }));

  return { customers, total };
}

/**
 * Create a customer
 */
export async function createCustomer(
  organizationId: string,
  input: CreateCustomerInput
) {
  return await database.transaction(async (tx) => {
    const [created] = await tx
      .insert(customer)
      .values({
        organizationId,
        businessName: input.businessName.trim(),
        domain: normalizeOptionalDomain(input.domain),
        contactPhoneNumber: normalizeOptionalText(input.contactPhoneNumber),
        clientCode: normalizeOptionalText(input.clientCode),
        taxId: normalizeOptionalText(input.taxId),
        vatNumber: normalizeOptionalText(input.vatNumber),
      })
      .returning();

    await tx.insert(customerAddress).values(
      input.addresses.map((address) => ({
        customerId: created.id,
        type: address.type ?? "billing",
        label: normalizeOptionalText(address.label),
        line1: address.line1.trim(),
        line2: normalizeOptionalText(address.line2),
        postalCode: normalizeOptionalText(address.postalCode),
        city: address.city.trim(),
        stateProvince: normalizeOptionalText(address.stateProvince),
        countryCode: normalizeOptionalCountryCode(address.countryCode),
        latitude: address.latitude,
        longitude: address.longitude,
        googlePlaceId: normalizeOptionalText(address.googlePlaceId),
        isPrimary: address.isPrimary,
      }))
    );

    return created;
  });
}

/**
 * Update a customer
 */
export async function updateCustomer(
  id: string,
  organizationId: string,
  input: UpdateCustomerInput
) {
  const [existing] = await database
    .select()
    .from(customer)
    .where(
      and(eq(customer.id, id), eq(customer.organizationId, organizationId))
    )
    .limit(1);

  if (!existing) {
    return null;
  }

  const updates: Partial<InferSelectModel<typeof customer>> = {
    ...(input.businessName !== undefined && {
      businessName: input.businessName.trim(),
    }),
    ...(input.taxId !== undefined && {
      taxId: normalizeOptionalText(input.taxId),
    }),
    ...(input.vatNumber !== undefined && {
      vatNumber: normalizeOptionalText(input.vatNumber),
    }),
  };

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await database
    .update(customer)
    .set(updates)
    .where(
      and(eq(customer.id, id), eq(customer.organizationId, organizationId))
    )
    .returning();

  return updated ?? null;
}

/**
 * Delete a customer
 */
export async function deleteCustomerById(id: string, organizationId: string) {
  return await database.transaction(async (tx) => {
    await tx
      .update(payment)
      .set({ customerId: null })
      .where(
        and(
          eq(payment.organizationId, organizationId),
          eq(payment.customerId, id)
        )
      );

    const [deleted] = await tx
      .delete(customer)
      .where(
        and(eq(customer.id, id), eq(customer.organizationId, organizationId))
      )
      .returning();

    return deleted ?? null;
  });
}

/**
 * Delete multiple customers
 */
export async function deleteCustomersByIds(
  ids: string[],
  organizationId: string
) {
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    return [];
  }

  return await database.transaction(async (tx) => {
    await tx
      .update(payment)
      .set({ customerId: null })
      .where(
        and(
          eq(payment.organizationId, organizationId),
          inArray(payment.customerId, uniqueIds)
        )
      );

    const deletedCustomers = await tx
      .delete(customer)
      .where(
        and(
          eq(customer.organizationId, organizationId),
          inArray(customer.id, uniqueIds)
        )
      )
      .returning();

    return deletedCustomers;
  });
}

/**
 * Create an address for a customer
 */
export async function createCustomerAddress(
  customerId: string,
  organizationId: string,
  input: CreateCustomerAddressInput
) {
  const [existingCustomer] = await database
    .select()
    .from(customer)
    .where(
      and(
        eq(customer.id, customerId),
        eq(customer.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!existingCustomer) {
    return null;
  }

  if (input.isPrimary) {
    await database
      .update(customerAddress)
      .set({ isPrimary: false })
      .where(eq(customerAddress.customerId, customerId));
  }

  const [created] = await database
    .insert(customerAddress)
    .values({
      customerId,
      type: input.type,
      label: normalizeOptionalText(input.label),
      line1: input.line1.trim(),
      line2: normalizeOptionalText(input.line2),
      postalCode: normalizeOptionalText(input.postalCode),
      city: input.city.trim(),
      stateProvince: normalizeOptionalText(input.stateProvince),
      countryCode: normalizeOptionalCountryCode(input.countryCode),
      latitude: input.latitude,
      longitude: input.longitude,
      googlePlaceId: normalizeOptionalText(input.googlePlaceId),
      isPrimary: input.isPrimary ?? false,
    })
    .returning();

  return created ?? null;
}

/**
 * Update a customer address
 */
export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  organizationId: string,
  input: UpdateCustomerAddressInput
) {
  const [existing] = await database
    .select({ address: customerAddress })
    .from(customerAddress)
    .innerJoin(customer, eq(customer.id, customerAddress.customerId))
    .where(
      and(
        eq(customerAddress.id, addressId),
        eq(customerAddress.customerId, customerId),
        eq(customer.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!existing?.address) {
    return null;
  }

  if (input.isPrimary) {
    await database
      .update(customerAddress)
      .set({ isPrimary: false })
      .where(
        and(
          eq(customerAddress.customerId, customerId),
          ne(customerAddress.id, addressId)
        )
      );
  }

  const updates: Partial<InferSelectModel<typeof customerAddress>> = {
    ...(input.type !== undefined && { type: input.type }),
    ...(input.label !== undefined && {
      label: normalizeOptionalText(input.label),
    }),
    ...(input.line1 !== undefined && { line1: input.line1.trim() }),
    ...(input.line2 !== undefined && {
      line2: normalizeOptionalText(input.line2),
    }),
    ...(input.postalCode !== undefined && {
      postalCode: normalizeOptionalText(input.postalCode),
    }),
    ...(input.city !== undefined && { city: input.city.trim() }),
    ...(input.stateProvince !== undefined && {
      stateProvince: normalizeOptionalText(input.stateProvince),
    }),
    ...(input.countryCode !== undefined && {
      countryCode: normalizeOptionalCountryCode(input.countryCode),
    }),
    ...(input.latitude !== undefined && { latitude: input.latitude }),
    ...(input.longitude !== undefined && { longitude: input.longitude }),
    ...(input.googlePlaceId !== undefined && {
      googlePlaceId: normalizeOptionalText(input.googlePlaceId),
    }),
    ...(input.isPrimary !== undefined && { isPrimary: input.isPrimary }),
  };

  if (Object.keys(updates).length === 0) {
    return existing.address;
  }

  const [updated] = await database
    .update(customerAddress)
    .set(updates)
    .where(
      and(
        eq(customerAddress.id, addressId),
        eq(customerAddress.customerId, customerId)
      )
    )
    .returning();

  return updated ?? null;
}

/**
 * Delete a customer address
 */
export async function deleteCustomerAddressById(
  customerId: string,
  addressId: string,
  organizationId: string
) {
  const [existing] = await database
    .select({ addressId: customerAddress.id })
    .from(customerAddress)
    .innerJoin(customer, eq(customer.id, customerAddress.customerId))
    .where(
      and(
        eq(customerAddress.id, addressId),
        eq(customerAddress.customerId, customerId),
        eq(customer.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!existing) {
    return null;
  }

  const [deleted] = await database
    .delete(customerAddress)
    .where(
      and(
        eq(customerAddress.id, addressId),
        eq(customerAddress.customerId, customerId)
      )
    )
    .returning();

  return deleted ?? null;
}
