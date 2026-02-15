import app from "./app";
import { validateEnv } from "./utils/validate-env";

validateEnv();

const port = Number(process.env.PORT ?? "4000");

export default {
  hostname: "0.0.0.0",
  port: Number.isNaN(port) ? 4000 : port,
  fetch: app.fetch,
};
