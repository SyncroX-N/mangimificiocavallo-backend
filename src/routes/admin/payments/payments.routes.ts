import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { createPaymentHandler, createPaymentSchema } from "./create";
import { deletePayment, deletePayments, deletePaymentsSchema } from "./delete";
import { getPayment } from "./get";
import { getPaymentsSchema, list } from "./list";
import { updatePaymentHandler, updatePaymentSchema } from "./update";

const paymentIdParamSchema = z.union([
  z.uuid(),
  z.object({
    id: z.uuid(),
  }),
]);

function resolvePaymentIdParam(value: z.infer<typeof paymentIdParamSchema>) {
  return typeof value === "string" ? value : value.id;
}

const paymentsRoutes = new Hono()
  .post("/", zValidator("json", createPaymentSchema), async (c) => {
    const input = c.req.valid("json");
    const member = c.get("member");
    return await createPaymentHandler(c, {
      organizationId: member.organizationId,
      input,
    });
  })
  .get("/", zValidator("query", getPaymentsSchema), async (c) => {
    const { page, perPage, search } = c.req.valid("query");
    const member = c.get("member");

    return await list(c, {
      organizationId: member.organizationId,
      page,
      perPage,
      search,
    });
  })
  .post("/bulk-delete", zValidator("json", deletePaymentsSchema), async (c) => {
    const { ids } = c.req.valid("json");
    const member = c.get("member");

    return await deletePayments(c, ids, member.organizationId);
  })
  .get("/:id", zValidator("param", paymentIdParamSchema), async (c) => {
    const id = resolvePaymentIdParam(c.req.valid("param"));
    const member = c.get("member");
    return await getPayment(c, id, member.organizationId);
  })
  .patch(
    "/:id",
    zValidator("param", paymentIdParamSchema),
    zValidator("json", updatePaymentSchema),
    async (c) => {
      const id = resolvePaymentIdParam(c.req.valid("param"));
      const input = c.req.valid("json");
      const member = c.get("member");
      return await updatePaymentHandler(c, {
        id,
        organizationId: member.organizationId,
        input,
      });
    }
  )
  .delete("/:id", zValidator("param", paymentIdParamSchema), async (c) => {
    const id = resolvePaymentIdParam(c.req.valid("param"));
    const member = c.get("member");
    return await deletePayment(c, id, member.organizationId);
  });

export { paymentsRoutes };
