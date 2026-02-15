import { Hono } from "hono";
import { protect } from "@/middleware/auth.middleware";
import { requireOrgAdmin } from "@/middleware/org-admin";

import { customersRoutes } from "./customers/customers.routes";
import { me } from "./me";
import { paymentsRoutes } from "./payments/payments.routes";
import { placesRoutes } from "./places/places.routes";
import { usersRoutes } from "./users/users.routes";

const adminRoutes = new Hono()
  .use(protect)
  .use(requireOrgAdmin(["owner", "admin"]))
  .get("/me", me)
  .route("/customers", customersRoutes)
  .route("/places", placesRoutes)
  .route("/payments", paymentsRoutes)
  .route("/users", usersRoutes);

export { adminRoutes };
