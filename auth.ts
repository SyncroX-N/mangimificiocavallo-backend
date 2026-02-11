import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, organization } from "better-auth/plugins";
import {
  adminAc as adminPluginAdminAc,
  userAc as adminPluginUserAc,
} from "better-auth/plugins/admin/access";
import { eq } from "drizzle-orm";
import database from "@/db";
import schema from "@/db/schema";
import { member as memberTable } from "@/db/schema/auth/member";
import { ac, admin as adminAc, member, owner } from "@/lib/permissions";

const baseUrl = process.env.BASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;

// Super admin user IDs - users with these IDs will have super admin access
const superAdminUserIds = process.env.SUPER_ADMIN_USER_IDS
  ? process.env.SUPER_ADMIN_USER_IDS.split(",").map((id) => id.trim())
  : [];

export const auth = betterAuth({
  baseURL: baseUrl,
  secret,
  basePath: "/api/auth", // Full path: Hono basePath "/api" + route "/auth/*"
  plugins: [
    expo(),
    admin({
      // Super admins can be identified by role or user ID.
      // adminRoles must be keys in roles; default roles only include "admin" and "user".
      adminRoles: ["super-admin", "admin"],
      adminUserIds: superAdminUserIds,
      roles: {
        "super-admin": adminPluginAdminAc,
        admin: adminPluginAdminAc,
        user: adminPluginUserAc,
      },
    }),
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
        adminAc,
        member,
      },

      // Add isActive field to member table for tracking active concierge status
      schema: {
        member: {
          additionalFields: {
            isActive: {
              type: "boolean",
              defaultValue: true,
              required: false,
            },
          },
        },
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
  trustedOrigins: [
    "exp://",
    "trotter-business://", // Development mode - Expo's exp:// scheme with local IP ranges
    "exp+trotter-business://", // Expo development client scheme
    "exp://*/*", // Trust all Expo development URLs
    "exp://10.0.0.*:*/*", // Trust 10.0.0.x IP range
    "exp://192.168.*.*:*/*", // Trust 192.168.x.x IP range
    "exp://172.*.*.*:*/*", // Trust 172.x.x.x IP range
    "exp://localhost:*/*", // Trust localhost
    "http://localhost:3000", // Trust localhost
  ],
  socialProviders: {
    apple: {
      clientId: process.env.IOS_CLIENT_ID,
      clientSecret: process.env.IOS_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_WEB_CLIENT_ID,
      clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET,
      prompt: "select_account",
      // Configuration checklist:
      // 1. Redirect URIs in Google Cloud Console (Authorized redirect URIs):
      //    - http://localhost:4000/api/auth/callback/google
      //    - http://127.0.0.1:4000/api/auth/callback/google
      // 2. Verify GOOGLE_WEB_CLIENT_ID matches the Client ID in Google Cloud Console
      // 3. Verify GOOGLE_WEB_CLIENT_SECRET matches the Client Secret for the same OAuth 2.0 Client
      //    - If unsure, regenerate the client secret in Google Cloud Console
      // 4. Ensure the OAuth consent screen is properly configured
    },
  },
});
