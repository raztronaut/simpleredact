import { createAuthClient } from "better-auth/react";

// Use environment variable for production, fallback to localhost for dev
const authURL = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";

export const authClient = createAuthClient({
    baseURL: authURL,
});

// Export commonly used hooks and methods
export const { signIn, signUp, signOut, useSession } = authClient;
