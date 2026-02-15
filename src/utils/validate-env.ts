import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  APPLICATION_ALLOWED_ORIGINS: z.string(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_DNS: z.string().optional(),
  BETTER_AUTH_URL: z.string(),
  BASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string(),
  GOOGLE_PLACES_API_KEY: z.string(),
});

/**
 * Validates the environment variables using Zod schema
 * @returns The validated environment variables
 * @throws Error if any required environment variable is missing or invalid
 */
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as z.ZodError).issues;
      const missingEnvVars = issues
        .map((issue) => issue.path.join("."))
        .join(", ");
      throw new Error(`Environment validation failed: ${missingEnvVars}`);
    }
    throw new Error("Failed to validate environment variables");
  }
}

// Type for validated environment
export type ValidatedEnv = ReturnType<typeof validateEnv>;

declare global {
  // biome-ignore lint/style/noNamespace: Update of types
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
