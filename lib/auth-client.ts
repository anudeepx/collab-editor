import { createAuthClient } from "better-auth/react";

const authBaseUrl =
  process.env.NEXT_PUBLIC_AUTH_URL?.trim() ||
  `${process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001"}/auth`;

const authClient = createAuthClient({
  baseURL: authBaseUrl,
});

export { authClient };
