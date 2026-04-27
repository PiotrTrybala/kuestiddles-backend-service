import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import {
    searchQuests,
    getQuestById,
    getQuestBySlug,
    getQuestsByGameId,
    createQuest,
    updateQuest,
    updateQuestThumbnail,
    updateQuestLabels,
    updateQuestAnswers,
    removeQuestById,
    removeQuestBySlug,
    removeQuestByGameId,
} from "@/repositories/v3/quests";

export const questsRouter = new Hono<AppEnv>();

// Search
questsRouter.get("/search", zValidator("query", z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    title: z.string().default(""),
    labels: z.string().transform((value) => value.split(",")).default([]),
})), async (c) => {
    const organization = c.get("organization")!;
    const { page, pageSize, title, labels } = c.req.valid("query");

    const { results, error } = await searchQuests(
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

// Get by ID
questsRouter.get("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { quest, error } = await getQuestById(id);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json(quest);
});

// Get by game ID
questsRouter.get("/game/:gameId", zValidator("param", z.object({
    gameId: z.uuid(),
})), async (c) => {
    const { gameId } = c.req.valid("param");

    const { quests, error } = await getQuestsByGameId(gameId);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ quests });
});

// Get by slug
questsRouter.get("/slug/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { quest, error } = await getQuestBySlug(organization.id, slug);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json(quest);
});

// Create
questsRouter.post("/", zValidator("json", z.object({
    landmarkId: z.uuid(),
    title: z.string(),
    description: z.string(),
    points: z.number(),
    gameId: z.string().nullish(),
    slug: z.string().nullish(),
    labels: z.string().array().nullish(),
    answers: z.string().array().nullish(),
    thumbnail: z.string().nullish(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { landmarkId, title, description, points, gameId, slug, labels, answers, thumbnail } = c.req.valid("json");

    const { id, error } = await createQuest(
        organization.id,
        landmarkId,
        title,
        description,
        points,
        gameId ?? undefined,
        slug ?? undefined,
        labels ?? undefined,
        answers ?? undefined,
        thumbnail ?? undefined,
    );

    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id });
});

// Update title/description/points/landmark
questsRouter.patch("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    points: z.number().optional(),
    landmark_id: z.string().uuid().optional(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const { id: questId, error } = await updateQuest(id, data);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: questId });
});

// Update thumbnail
questsRouter.patch("/:id/thumbnail", zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    thumbnail: z.string(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { thumbnail } = c.req.valid("json");

    const { id: questId, error } = await updateQuestThumbnail(id, thumbnail);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: questId });
});

// Update labels
questsRouter.patch("/:id/labels", zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    labels: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { labels } = c.req.valid("json");

    const { id: questId, error } = await updateQuestLabels(id, labels);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: questId });
});

// Update answers
questsRouter.patch("/:id/answers", zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    answers: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { answers } = c.req.valid("json");

    const { id: questId, error } = await updateQuestAnswers(id, answers);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: questId });
});

// Delete by ID
questsRouter.delete("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { id: questId, error } = await removeQuestById(id);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id: questId });
});

// Delete by game ID
questsRouter.delete("/game/:gameId", zValidator("param", z.object({
    gameId: z.uuid(),
})), async (c) => {
    const { gameId } = c.req.valid("param");

    const { count, error } = await removeQuestByGameId(gameId);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ count });
});

// Delete by slug
questsRouter.delete("/slug/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { id, error } = await removeQuestBySlug(organization.id, slug);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ id });
});