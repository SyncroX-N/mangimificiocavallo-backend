import { Hono } from "hono";
import { protect } from "@/middleware/auth.middleware";
import { requireOrgAdmin } from "@/middleware/org-admin";
import { calendarEventsRoutes } from "./calendar-events/calendar-events.routes";

import { locationsRoutes } from "./locations/locations.routes";
import { me } from "./me";
import { requestsRoutes } from "./requests/requests.routes";
import { usersRoutes } from "./users/users.routes";

const webRoutes = new Hono()
  .use(protect)
  .use(requireOrgAdmin(["owner", "admin"]))
  .get("/me", me)
  .route("/locations", locationsRoutes)
  .route("/requests", requestsRoutes)
  .route("/users", usersRoutes)
  .route("/calendar-events", calendarEventsRoutes);

export { webRoutes };
