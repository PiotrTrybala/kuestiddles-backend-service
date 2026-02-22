import { Hono } from "hono";
import { eq, ilike, arrayOverlaps, and } from "drizzle-orm";
import { landmarks } from "../../database/schema/organizations";
import { database } from "../../database/db";
import { requireAdmin } from "./middleware";

export const landmarksRouter = new Hono();

landmarksRouter.get("/list", requireAdmin, async (c) => {
    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);
    const labels = (c.req.query("labels") || "")
        .split(",")
        .map(l => l.trim())
        .filter(Boolean);

    const name = c.req.query("name");

    const offset = page * pageSize;
    const limit = pageSize;

    const conditions = [];

    if (name && name.trim() !== "") {
        conditions.push(ilike(landmarks.name, `%${name}%`));
    }

    if (labels.length > 0) {
        conditions.push(arrayOverlaps(landmarks.labels, labels));
    }

    const result = await database.select()
        .from(landmarks)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .offset(offset)
        .limit(limit);


    return c.json({
        page: page,
        landmarks: result,
    });
});

landmarksRouter.get("/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");

    const result = await database.select().from(landmarks).where(eq(landmarks.id, id));

    console.log('landmark result:', result);

    if (result.length === 0) return c.notFound();

    const [landmark] = result;

    return c.json({ ...landmark });
});

// TODO: Add input validation

// TODO: Add better error handling to routes

type LandmarkCreate = {
    name: string,
    description: string,
    labels: string[],
    thumbnail: string | null,
    assets: string[],
    position: {
        longitude: number,
        latitude: number,
    },
};

// TODO: Add error handling and validation

landmarksRouter.post("/", requireAdmin, async (c) => {

    const body = await c.req.json<LandmarkCreate>();

    const [landmark] = await database.insert(landmarks).values({
        name: body.name,
        labels: body.labels,
        thumbnail: body.thumbnail ?? "",
        assets: body.assets,
        coords: {
            x: body.position.longitude,
            y: body.position.latitude,
        }
    }).returning();

    return c.json({ id: landmark?.id });
});

type LandmarkUpdate = {
    updates: {
        field: string,
        value: any,
    }[]
};

landmarksRouter.patch("/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<LandmarkUpdate>();

    if (!body.updates?.length) {
        return c.json({ error: "No updates provided" }, 400);
    }

    const allowedFields = new Set([
        "name",
        "description",
        "labels",
        "thumbnail",
        "assets",
        "position",
    ]);

    const updateData: any = {};

    for (const update of body.updates) {
        if (!allowedFields.has(update.field)) {
            return c.json({ error: `Invalid field: ${update.field}` }, 400);
        }

        if (update.field === "position") {
            const { longitude, latitude } = update.value || {};

            if (
                typeof longitude !== "number" ||
                typeof latitude !== "number"
            ) {
                return c.json({ error: "Invalid coordinates" }, 400);
            }

            updateData.coords = {
                x: longitude,  // mode: 'xy'
                y: latitude,
            };

            continue;
        }

        updateData[update.field] = update.value;
    }

    if (Object.keys(body).length === 0) {
        return c.json({ error: "No updates found" }, 400);
    }

    const [updated] = await database
        .update(landmarks)
        .set(updateData)
        .where(eq(landmarks.id, id))
        .returning();

    if (!updated) {
        return c.notFound();
    }

    return c.json(updated);
});

landmarksRouter.delete("/:id", requireAdmin, async (c) => {
    
    const id = c.req.param("id");

    await database.delete(landmarks).where(eq(landmarks.id, id));
    return c.json({ message: "Deleted landmark" });
});