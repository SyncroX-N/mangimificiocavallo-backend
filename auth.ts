import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import database from "@/db";
import schema from "@/db/schema";
import { member as memberTable } from "@/db/schema/auth/member";
import { ac, owner, production_manager } from "@/lib/permissions";
import { getAllowedOrigins } from "@/utils/allowed-origins";

const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;

export const auth = betterAuth({
  baseURL: baseUrl,
  secret,
  basePath: "/api/auth", // Full path: Hono basePath "/api" + route "/auth/*"
  plugins: [
    expo(),
    bearer(),
    organization({
      teams: {
        enabled: true,
      },
      allowUserToCreateOrganization: false,

      // Access control configuration
      ac,
      roles: {
        owner,
        production_manager,
      },

      // Organization creation hooks
      organizationHooks: {
        async afterCreateOrganization({ organization: org, user: authUser }) {
          // You can add custom logic here, like:
          // - Creating default resources for the organization
          // - Sending welcome notifications
          // - Setting up default teams
          await console.log(
            `Organization created: ${org.name} by ${authUser.email}`
          );
        },

        // Member hooks
        async beforeAddMember({ organization: org }) {
          // You can add validation or custom logic before adding members
          await console.log(`Adding member to ${org.name}`);
        },

        async afterAddMember({ organization: org }) {
          // Send welcome email, create user profile, etc.
          await console.log(`Member added to ${org.name}`);
        },
      },
    }),
  ],
  database: drizzleAdapter(database, {
    provider: "pg",
    schema,
  }),
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          // Auto-set organizationId from member table
          const [membership] = await database
            .select({ organizationId: memberTable.organizationId })
            .from(memberTable)
            .where(eq(memberTable.userId, session.userId))
            .limit(1);

          if (membership?.organizationId) {
            return {
              data: {
                ...session,
                activeOrganizationId: membership.organizationId,
              },
            };
          }
          return { data: session };
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: getAllowedOrigins(),
});
