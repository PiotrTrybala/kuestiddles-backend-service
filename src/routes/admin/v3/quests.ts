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
import { requireOrganization } from "@/routes/middleware";
import { UUID_PATTERN } from "@/globals";

export const questsRouter = new Hono<AppEnv>();

questsRouter.use("*", requireOrganization);

questsRouter.get("/search", zValidator("query", z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    title: z.string().default(""),
    labels: z.string().transform((value) => value.split(",")).default([]),
})), async (c) => {
    const organization = c.get("organization")!;
    const { page, pageSize, title, labels } = c.req.valid("query");

    const { quests, error } = await searchQuests(
        organization.id,
        page,
        pageSize,
        title,
        labels,
    );

    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ quests: quests });
});

questsRouter.get("/recent", async (c) => {
    return c.body(null, 501); 
});

questsRouter.post("/", zValidator("json", z.object({
    landmarkId: z.uuid(),
    title: z.string(),
    description: z.string(),
    points: z.number(),
    gameId: z.string().optional(),
    slug: z.string().optional(), // Default: slugified name
    labels: z.string().array().optional(), // Default: []
    answers: z.string().array().optional(), // Default: []
    thumbnail: z.string().optional(), // TODO: Add default value to database
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();
    const user = c.get("user")!;

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

    if (error || !id) {
        return c.json({ message: error }, 500);
    }


    return c.json({ id });
});


questsRouter.get(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const organization = c.get("organization")!;
    const user = c.get("user")!;
    const { id } = c.req.valid("param");

    const { quest, error } = await getQuestById(id);
    if (error || !quest) {
        return c.json({ message: error }, 500);
    }


    return c.json(quest);
});

questsRouter.get(`/game/:gameId{${UUID_PATTERN}}`, zValidator("param", z.object({
    gameId: z.uuid(),
})), async (c) => {
    const { gameId } = c.req.valid("param");

    const { quests, error } = await getQuestsByGameId(gameId);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ quests });
});

questsRouter.patch(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    points: z.number().optional(),
    landmarkId: z.uuid().optional(),
    gameId: z.uuid().optional(),
})), async (c) => {
    const organization = c.get("organization")!;
    const user = c.get("user")!;
    const { id } = c.req.valid("param");
    const { title, description, points, landmarkId, gameId } = c.req.valid("json");

    const { updated, error } = await updateQuest(id, title, description, points, landmarkId, gameId);
    if (error) {
        return c.json({ message: error }, 500);
    }

    // await registerRecentEntity('quests', organization.id, user.id, id);

    return c.json({ updated });
});

questsRouter.patch(`/:id{${UUID_PATTERN}}/thumbnail`, zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    thumbnail: z.string(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { thumbnail } = c.req.valid("json");

    const { updated, error } = await updateQuestThumbnail(id, thumbnail);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ updated });
});

questsRouter.patch(`/:id{${UUID_PATTERN}}/labels`, zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    labels: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { labels } = c.req.valid("json");

    const { updated, error } = await updateQuestLabels(id, labels);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ updated });
});

questsRouter.patch(`/:id{${UUID_PATTERN}}/answers`, zValidator("param", z.object({
    id: z.uuid(),
})), zValidator("json", z.object({
    answers: z.string().array(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { answers } = c.req.valid("json");

    const { updated, error } = await updateQuestAnswers(id, answers);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ updated });
});

questsRouter.delete(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { deleted, error } = await removeQuestById(id);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ deleted });
});

questsRouter.delete(`/game/:gameId{${UUID_PATTERN}}`, zValidator("param", z.object({
    gameId: z.uuid(),
})), async (c) => {
    const { gameId } = c.req.valid("param");

    const { count, error } = await removeQuestByGameId(gameId);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ count });
});

questsRouter.get("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    const user = c.get("user")!;
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { quest, error } = await getQuestBySlug(organization.id, slug);
    if (error || !quest) {
        return c.json({ message: error }, 500);
    }

    // await registerRecentEntity('quests', organization.id, user.id, quest.id);

    return c.json(quest);
});

questsRouter.delete("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { deleted, error } = await removeQuestBySlug(organization.id, slug);
    if (error) {
        return c.json({ message: error }, 500);
    }

    return c.json({ deleted });
});