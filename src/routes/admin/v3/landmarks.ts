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

export const landmarksRouter = new Hono<AppEnv>();

// Search
landmarksRouter.get("/search", zValidator("query", z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    title: z.string().default(""),
    labels: z.string().transform((value) => value.split(",")).default([]),
})), async (c) => {
    const organization = c.get("organization")!;
    const { page, pageSize, title, labels } = c.req.valid("query");

    const { results, error } = await searchLandmarks(
        organization.id,
        page,
        pageSize,
        title,
        labels,
    );

    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ results });
});

landmarksRouter.get("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { landmark, error } = await getLandmarkById(id);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json(landmark);
});

landmarksRouter.get("/slug/:slug", zValidator("param", z.object({
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

landmarksRouter.post("/", zValidator("json", z.object({
    title: z.string(),
    description: z.string(),
    longitude: z.number(),
    latitude: z.number(),
    slug: z.string().nullish(),
    labels: z.string().array().nullish(),
    assets: z.string().array().nullish(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { title, description, longitude, latitude, slug, labels, assets } = c.req.valid("json");

    const { id, error } = await createLandmark(
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

    return c.json({ id });
});

landmarksRouter.patch("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    title: z.string().optional(),
    description: z.string().optional(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { title, description } = c.req.valid("json");

    const { id: landmarkId, error } = await updateLandmark(id, title, description);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: landmarkId });
});

// Update assets
landmarksRouter.patch("/:id/assets", zValidator("param", z.object({
    id: z.uuid(), 
})), zValidator("json", z.object({
    assets: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { assets } = c.req.valid("json");

    const { id: landmarkId, error } = await updateLandmarkAssets(id, assets);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: landmarkId });
});

// Update labels
landmarksRouter.patch("/:id/labels", zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    labels: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { labels } = c.req.valid("json");

    const { id: landmarkId, error } = await updateLandmarkLabels(id, labels);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: landmarkId });
});

landmarksRouter.patch("/:id/location", zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    longitude: z.number(),
    latitude: z.number(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { longitude, latitude } = c.req.valid("json");

    const { id: landmarkId, error } = await updateLandmarkLocation(id, longitude, latitude);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: landmarkId });
});

landmarksRouter.delete("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { id: landmarkId, error } = await removeLandmarkById(id);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: landmarkId });
});

landmarksRouter.delete("/slug/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { id, error } = await removeLandmarkBySlug(organization.id, slug);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id });
});