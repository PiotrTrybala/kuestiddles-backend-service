import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import {
    searchLandmarks,
    getLandmarkById,
    getLandmarkBySlug,
    createLandmark,
    updateLandmark,
    updateLandmarkAssets,
    updateLandmarkLabels,
    updateLandmarkLocation,
    removeLandmarkById,
    removeLandmarkBySlug,
} from "@/repositories/v3/landmarks";
import { landmarks } from "@/database/schema";
import { requireOrganization } from "@/routes/middleware";
import { UUID_PATTERN } from "@/globals";

export const landmarksRouter = new Hono<AppEnv>();

landmarksRouter.use("*", requireOrganization);

// Search
landmarksRouter.get("/search", zValidator("query", z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    title: z.string().optional(),
    labels: z.string()
        .optional()
        .transform((val) => val && val.trim() !== "" ? val.split(',') : undefined),
})), async (c) => {
    const organization = c.get("organization")!;
    const { page, pageSize, title, labels } = c.req.valid("query");

    const { landmarks, error } = await searchLandmarks(
        organization.id,
        page,
        pageSize,
        title,
        labels,
    );

    console.log('landmarks:', landmarks);

    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ landmarks: landmarks });
});

landmarksRouter.get("/recent", async (c) => {
    return c.body(null, 501);
});

landmarksRouter.post("/", zValidator("json", z.object({
    title: z.string(),
    description: z.string(),
    longitude: z.number(),
    latitude: z.number(),
    slug: z.string().nullish(),
    labels: z.string().array().optional(),
    assets: z.string().array().optional(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { title, description, longitude, latitude, slug, labels, assets } = c.req.valid("json");

    const { landmark, error } = await createLandmark(
        organization.id,
        title,
        description,
        longitude,
        latitude,
        slug ?? undefined,
        labels ?? undefined,
        assets ?? undefined,
    );

    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ landmark: landmark });
});

landmarksRouter.get(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { landmark, error } = await getLandmarkById(id);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json(landmark);
});

landmarksRouter.get("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { landmark, error } = await getLandmarkBySlug(organization.id, slug);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json(landmark);
});

landmarksRouter.patch(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    title: z.string().optional(),
    description: z.string().optional(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { title, description } = c.req.valid("json");

    const { landmark, error } = await updateLandmark(id, title, description);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ landmark });
});

// Update assets
landmarksRouter.patch(`/:id{${UUID_PATTERN}}/assets`, zValidator("param", z.object({
    id: z.uuid(), 
})), zValidator("json", z.object({
    assets: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { assets } = c.req.valid("json");

    const { landmark, error } = await updateLandmarkAssets(id, assets);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ landmark });
});

// Update labels
landmarksRouter.patch(`/:id{${UUID_PATTERN}}/labels`, zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    labels: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { labels } = c.req.valid("json");

    const { landmark, error } = await updateLandmarkLabels(id, labels);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ landmark });
});

landmarksRouter.patch(`/:id{${UUID_PATTERN}}/location`, zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    longitude: z.number(),
    latitude: z.number(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { longitude, latitude } = c.req.valid("json");

    const { landmark, error } = await updateLandmarkLocation(id, longitude, latitude);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ landmark });
});

landmarksRouter.delete(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { deleted, error } = await removeLandmarkById(id);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ deleted });
});

landmarksRouter.delete("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { deleted, error } = await removeLandmarkBySlug(organization.id, slug);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ deleted });
});