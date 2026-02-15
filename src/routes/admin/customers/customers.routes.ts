import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { createCustomerHandler, createCustomerSchema } from "./create";
import {
  createCustomerAddressHandler,
  createCustomerAddressSchema,
} from "./create-address";
import {
  deleteCustomer,
  deleteCustomers,
  deleteCustomersSchema,
} from "./delete";
import { deleteCustomerAddress } from "./delete-address";
import { getCustomersSchema, listCustomersHandler } from "./list";
import { updateCustomerHandler, updateCustomerSchema } from "./update";
import {
  updateCustomerAddressHandler,
  updateCustomerAddressSchema,
} from "./update-address";

const customerAddressParamsSchema = z.object({
  customerId: z.uuid(),
  addressId: z.uuid(),
});

const customerAddressCreateParamsSchema = z.object({
  customerId: z.uuid(),
});

const customersRoutes = new Hono()
  .post("/", zValidator("json", createCustomerSchema), async (c) => {
    const input = c.req.valid("json");
    const member = c.get("member");

    return await createCustomerHandler(c, {
      organizationId: member.organizationId,
      input,
    });
  })
  .get("/", zValidator("query", getCustomersSchema), async (c) => {
    const { page, perPage, search } = c.req.valid("query");
    const member = c.get("member");

    return await listCustomersHandler(c, {
      organizationId: member.organizationId,
      page,
      perPage,
      search,
    });
  })
  .post(
    "/bulk-delete",
    zValidator("json", deleteCustomersSchema),
    async (c) => {
      const { ids } = c.req.valid("json");
      const member = c.get("member");

      return await deleteCustomers(c, ids, member.organizationId);
    }
  )
  .patch(
    "/:id",
    zValidator("param", z.uuid()),
    zValidator("json", updateCustomerSchema),
    async (c) => {
      const id = c.req.valid("param");
      const input = c.req.valid("json");
      const member = c.get("member");

      return await updateCustomerHandler(c, {
        id,
        organizationId: member.organizationId,
        input,
      });
    }
  )
  .delete("/:id", zValidator("param", z.uuid()), async (c) => {
    const id = c.req.valid("param");
    const member = c.get("member");

    return await deleteCustomer(c, id, member.organizationId);
  })
  .post(
    "/:customerId/addresses",
    zValidator("param", customerAddressCreateParamsSchema),
    zValidator("json", createCustomerAddressSchema),
    async (c) => {
      const { customerId } = c.req.valid("param");
      const input = c.req.valid("json");
      const member = c.get("member");

      return await createCustomerAddressHandler(c, {
        customerId,
        organizationId: member.organizationId,
        input,
      });
    }
  )
  .patch(
    "/:customerId/addresses/:addressId",
    zValidator("param", customerAddressParamsSchema),
    zValidator("json", updateCustomerAddressSchema),
    async (c) => {
      const { customerId, addressId } = c.req.valid("param");
      const input = c.req.valid("json");
      const member = c.get("member");

      return await updateCustomerAddressHandler(c, {
        customerId,
        addressId,
        organizationId: member.organizationId,
        input,
      });
    }
  )
  .delete(
    "/:customerId/addresses/:addressId",
    zValidator("param", customerAddressParamsSchema),
    async (c) => {
      const { customerId, addressId } = c.req.valid("param");
      const member = c.get("member");

      return await deleteCustomerAddress(
        c,
        customerId,
        addressId,
        member.organizationId
      );
    }
  );

export { customersRoutes };
