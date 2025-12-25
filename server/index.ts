import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { presetsRouter } from "./api/presets";
import "dotenv/config";

const app = new Hono();

// Error handler for better debugging in Vercel logs
app.onError((err, c) => {
    console.error(`❌ Server Error: ${err.message}`);
    console.error(err.stack);
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

// Build allowed origins for CORS
const getAllowedOrigins = (): string[] => {
    const origins = ["http://localhost:5173"];
    if (process.env.PRODUCTION_URL) {
        origins.push(process.env.PRODUCTION_URL);
    }
    if (process.env.ADDITIONAL_ORIGINS) {
        origins.push(...process.env.ADDITIONAL_ORIGINS.split(",").map((o) => o.trim()));
    }
    return origins;
};

// CORS configuration - supports dev and production origins
app.use(
    "/api/*",
    cors({
        origin: getAllowedOrigins(),
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

// Mount Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Mount presets API
app.route("/api/presets", presetsRouter);

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.AUTH_PORT) || 3000;

if (process.env.NODE_ENV !== "production") {
    console.log(`🔐 Auth server running on http://localhost:${port}`);
    serve({
        fetch: app.fetch,
        port,
    });
}

export default app;
