/**
 * Validated environment configuration.
 * All env vars must be prefixed with EXPO_PUBLIC_ to be available in the bundle.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!API_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in environment");
}
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment");
}

export const env = {
  API_URL,
  CLERK_PUBLISHABLE_KEY,
} as const;
