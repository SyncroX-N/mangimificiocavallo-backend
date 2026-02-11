import app from "./app";
import { validateEnv } from "./utils/validate-env";

validateEnv();

export default {
  port: 4000,
  fetch: app.fetch,
};
