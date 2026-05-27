import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { groupsRouter } from "./groups";
import { invitesRouter } from "./invites";
import { requireAuth, requireOrganization } from "@/routes/middleware";
import { createCompetition, getCompetitionById, getCompetitionBySlug, getLeaderboard, removeCompetitionById, removeCompetitionBySlug, searchCompetitions, updateCompetitionStatusById } from "@/repositories/v3/competitions/competitions";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.use("*", requireOrganization);

competitionsRouter.route("/:competitionId/groups", groupsRouter);
competitionsRouter.route("/:competitionId/invites", invitesRouter);

competitionsRouter.get("/search", zValidator("query", z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    title: z.string().default(""),
    labels: z.string().transform((value) => value.split(",")).default([]),
})), async (c) => {
    const organization = c.get("organization")!;
    const { page, pageSize, title, labels } = c.req.valid("query");

    const { results, error } = await searchCompetitions(
        organization.id,
        page,
        pageSize,
        title,
    );

    if (error) return c.json({ error }, 500);
    return c.json({ results });
});

competitionsRouter.get("/:id/leaderboard", requireAuth("admin"), async (c) => {
    const id = c.req.param("id");

    const { entries, error } = await getLeaderboard(id);

    if (error) return c.json({ error }, 500);
    return c.json({ entries });
});

competitionsRouter.get("/slug/:slug", requireAuth("admin"), async (c) => {
    const organization = c.get("organization")!;
    const slug = c.req.param("slug");

    const { competition, error } = await getCompetitionBySlug(organization.id, slug);

    if (error) return c.json({ error }, 404);
    return c.json({ competition });
});

competitionsRouter.get("/:id", requireAuth("admin"), async (c) => {
    const id = c.req.param("id");

    const { competition, error } = await getCompetitionById(id);

    if (error) return c.json({ error }, 404);
    return c.json({ competition });
});

competitionsRouter.post("/", requireAuth("admin"), async (c) => {
    const organization = c.get("organization")!;
    const { name, slug } = await c.req.json();

    if (!name) return c.json({ error: "Name is required" }, 400);

    const { id, error } = await createCompetition(
        organization.id,
        name,
        slug,
        null,
        null,
        // expiresAt ? new Date(expiresAt) : null,
        // retainUntil ? new Date(retainUntil) : null
    );

    if (error) return c.json({ error }, 500);
    return c.json({ id }, 201);
});

competitionsRouter.patch("/:id", requireAuth("admin"), async (c) => {
    const id = c.req.param("id");
    const { expiresAt, retainUntil } = await c.req.json();

    if (!expiresAt || !retainUntil) {
        return c.json({ error: "expiresAt and retainUntil are required" }, 400);
    }

    const { id: updatedId, error } = await updateCompetitionStatusById(
        id,
        new Date(expiresAt),
        new Date(retainUntil)
    );

    if (error) return c.json({ error }, 500);
    return c.json({ id: updatedId });
});

competitionsRouter.delete("/slug/:slug", requireAuth("admin"), async (c) => {
    const organization = c.get("organization")!;
    const slug = c.req.param("slug");

    const { id, error } = await removeCompetitionBySlug(organization.id, slug);

    if (error) return c.json({ error }, 500);
    return c.json({ id });
});

competitionsRouter.delete("/:id", requireAuth("admin"), async (c) => {
    const id = c.req.param("id");

    const { id: deletedId, error } = await removeCompetitionById(id);

    if (error) return c.json({ error }, 500);
    return c.json({ id: deletedId });
});