import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./schema";

// Build trusted origins from environment
const getTrustedOrigins = (): string[] => {
    const origins = ["http://localhost:5173"]; // Dev server always included

    // Add production origin if set
    if (process.env.PRODUCTION_URL) {
        origins.push(process.env.PRODUCTION_URL);
    }

    // Add any additional origins from comma-separated list
    if (process.env.ADDITIONAL_ORIGINS) {
        origins.push(...process.env.ADDITIONAL_ORIGINS.split(",").map(o => o.trim()));
    }

    return origins;
};

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    // Social providers
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    // Rate limiting to prevent brute-force attacks
    rateLimit: {
        enabled: true,
        window: 60, // 1 minute
        max: 10, // max 10 requests per minute per IP
    },
    // Trusted origins for CORS - configured via environment
    trustedOrigins: getTrustedOrigins(),
});
