import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import {
    searchGroups,
    getGroupById,
    getGroupBySlug,
    getGroupUsers,
    createGroup,
    removeGroupById,
} from "@/repositories/v3/competitions/groups";
import z from "zod";
import { zValidator } from "@hono/zod-validator";

export const groupsRouter = new Hono<AppEnv>();

groupsRouter.get("/search", zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
})), async (c) => {
    const competitionId = c.req.param("competitionId")!;
    const { page, pageSize, name } = c.req.valid("query");

    const { results, error } = await searchGroups(
        competitionId,
        page,
        pageSize,
        name
    );

    if (error) return c.json({ error }, 500);
    return c.json({ results });
});

groupsRouter.get("/:id/users", async (c) => {
    const id = c.req.param("id");

    const { users, error } = await getGroupUsers(id);

    if (error) return c.json({ error }, 500);
    return c.json({ users });
});

groupsRouter.get("/slug/:slug", async (c) => {
    const organization = c.get("organization")!;
    const slug = c.req.param("slug");

    const { group, error } = await getGroupBySlug(organization.slug, slug);

    if (error) return c.json({ error }, 404);
    return c.json({ group });
});

groupsRouter.get("/:id", async (c) => {
    const id = c.req.param("id");

    const { group, error } = await getGroupById(id);

    if (error) return c.json({ error }, 404);
    return c.json({ group });
});

groupsRouter.post("/", async (c) => {
    const organization = c.get("organization")!;
    const competitionId = c.req.param("competitionId")!;
    const { name, slug } = await c.req.json();

    if (!name) return c.json({ error: "name is required" }, 400);

    const { id, error } = await createGroup(competitionId, name, slug);

    if (error) return c.json({ error }, 500);
    return c.json({ id }, 201);
});

groupsRouter.delete("/:id", async (c) => {
    const id = c.req.param("id");

    const { id: deletedId, error } = await removeGroupById(id);

    if (error) return c.json({ error }, 500);
    return c.json({ id: deletedId });
});