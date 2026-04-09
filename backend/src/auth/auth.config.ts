import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "../../lib/prisma.js";

const backendAuthUrl =
  process.env.BETTER_AUTH_URL?.trim() || "http://localhost:3001/auth";
const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";

export const auth = betterAuth({
  baseURL: backendAuthUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [frontendUrl],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
});
