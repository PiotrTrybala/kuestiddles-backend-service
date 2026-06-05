// `/:id{${UUID_PATTERN}}`

import type { AppEnv } from "@/config/app";
import { createCompetition, deleteCompetitionById, getCompetitionById, getCompetitionBySlug, searchCompetitions, updateCompetitionById } from "@/repositories/v3/competitions";
import { UUID_PATTERN } from "@/routes/api";
import { requireOrganization } from "@/routes/middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

// Competition router - /competitions

export const competitionsRouter = new Hono<AppEnv>();
competitionsRouter.use("*", requireOrganization);

competitionsRouter.get(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {

    const { id } = c.req.valid("param");

    const { competition, error } = await getCompetitionById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(competition);
});

competitionsRouter.get("/:slug", zValidator("param", z.object({
    slug: z.string().max(64, { error: "Max length of slug is 64 characters" }),
})), async (c) => {
    const organization = c.get("organization")!;
    const { slug } = c.req.valid("param");

    const { competition, error } = await getCompetitionBySlug(organization.id, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json(competition);
});

competitionsRouter.delete(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {

    const { id } = c.req.valid("param");

    const { deleted, error } = await deleteCompetitionById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({ deleted });
});

competitionsRouter.delete("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const { id } = c.get("organization")!;
    const { slug } = c.req.valid("param");

    const { deleted, error } = await deleteCompetitionById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({ deleted });
});

competitionsRouter.patch(`/:id{${UUID_PATTERN}}`, zValidator("json", z.object({
    name: z.string().max(64, { error: "Name is too long (max 64 characters)" }).optional(),
    status: z.enum(["onboarding", "in-progress", "finishing", "archived"]).optional(),
    finishedAt: z.date().refine((date) => date > new Date(), {
        error: "Date must be in the future",
    })
})), zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {

    const { name, status, finishedAt } = c.req.valid("json");
    const { id } = c.req.valid("param");

    const { competition, error } = await updateCompetitionById(id, name, status, finishedAt);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(competition);
});

competitionsRouter.get("/search", zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
})), async (c) => {
    const { id } = c.get("organization")!;
    const { page, pageSize, name } = c.req.valid("query");

    const { competitions, error } = await searchCompetitions(id, page, pageSize, { name });
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({ competitions })
});

competitionsRouter.post("/", zValidator("json", z.object({
    gameId: z.uuid(),
    name: z.string().max(64, { error: "Name is too long (max 64 characters)" }),
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters" }).optional(),
    finishesAt: z.date().optional(),
})), async (c) => {
    const { id } = c.get("organization")!;
    const { gameId, name, slug, finishesAt } = c.req.valid("json");

    const { competition, error } = await createCompetition(id, gameId, name, slug, finishesAt);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }


    return c.json(competition);
});

// Group router - /competitions/:competitionId/groups

// Invites router - /competitions/:competitionId/invites