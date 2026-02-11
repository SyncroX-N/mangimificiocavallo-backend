import { Hono } from "hono";
import { placesRoutes } from "./places.routes";

const sharedRoutes = new Hono()
  // .use(protect)
  .route("/places", placesRoutes);

export { sharedRoutes };
