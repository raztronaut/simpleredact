import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { preset } from "../schema";
import { auth } from "../auth";

// Define variables type for Hono context
type Variables = {
    userId: string;
};

const presetsRouter = new Hono<{ Variables: Variables }>();

// Helper to generate unique IDs
const generateId = () => crypto.randomUUID();

// Middleware to require authentication
presetsRouter.use("/*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("userId", session.user.id);
    return next();
});

// GET /api/presets - List user's presets
presetsRouter.get("/", async (c) => {
    const userId = c.get("userId");

    const presets = await db
        .select()
        .from(preset)
        .where(eq(preset.userId, userId));

    // Parse categories JSON for each preset
    const parsed = presets.map((p) => ({
        ...p,
        categories: JSON.parse(p.categories) as string[],
    }));

    return c.json(parsed);
});

// POST /api/presets - Create a new preset
presetsRouter.post("/", async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json<{ name: string; categories: string[] }>();

    if (!body.name || !Array.isArray(body.categories)) {
        return c.json({ error: "Invalid request body" }, 400);
    }

    const id = generateId();
    const now = new Date();

    await db.insert(preset).values({
        id,
        name: body.name,
        categories: JSON.stringify(body.categories),
        userId,
        createdAt: now,
        updatedAt: now,
    });

    return c.json(
        {
            id,
            name: body.name,
            categories: body.categories,
            userId,
            createdAt: now,
            updatedAt: now,
        },
        201
    );
});

// PUT /api/presets/:id - Update a preset
presetsRouter.put("/:id", async (c) => {
    const userId = c.get("userId");
    const presetId = c.req.param("id");
    const body = await c.req.json<{ name?: string; categories?: string[] }>();

    // Verify ownership
    const existing = await db
        .select()
        .from(preset)
        .where(and(eq(preset.id, presetId), eq(preset.userId, userId)))
        .limit(1);

    if (existing.length === 0) {
        return c.json({ error: "Preset not found" }, 404);
    }

    const updates: Partial<typeof preset.$inferInsert> = {
        updatedAt: new Date(),
    };

    if (body.name) updates.name = body.name;
    if (body.categories) updates.categories = JSON.stringify(body.categories);

    await db.update(preset).set(updates).where(eq(preset.id, presetId));

    return c.json({ success: true });
});

// DELETE /api/presets/:id - Delete a preset
presetsRouter.delete("/:id", async (c) => {
    const userId = c.get("userId");
    const presetId = c.req.param("id");

    // Verify ownership and delete
    await db
        .delete(preset)
        .where(and(eq(preset.id, presetId), eq(preset.userId, userId)));

    return c.json({ success: true });
});

export { presetsRouter };
