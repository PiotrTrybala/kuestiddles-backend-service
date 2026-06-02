import type { AppEnv } from "@/config/app";
import { deleteInvite, generateGroupInvite, searchInvites } from "@/repositories/v3/competitions/invites";
import { UUID_PATTERN } from "@/routes/api";
import { requireAuth } from "@/routes/middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

export const invitesRouter = new Hono<AppEnv>();

invitesRouter.use("*", requireAuth("admin"));

invitesRouter.get("/search", zValidator("query", z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
})), async (c) => {
    const organization = c.get("organization")!;
    const { page, pageSize } = c.req.valid("query");

    const { results, error } = await searchInvites(organization.id, page, pageSize);
    if (error) return c.json({ message: error }, 500);

    return c.json({ invites: results, }, 501);
});

invitesRouter.post("/", async (c) => {
    const { competitionId, groupId, expiresAt } = await c.req.json();

    if (!competitionId || !groupId || !expiresAt) {
        return c.json({ error: "competitionId, groupId and expiresAt are required" }, 400);
    }

    const { id, error } = await generateGroupInvite(
        competitionId,
        groupId,
        new Date(expiresAt)
    );

    if (error) return c.json({ error }, 500);
    return c.json({ id }, 201);
});

invitesRouter.delete(`/:id{${UUID_PATTERN}}`, async (c) => {

    const id = c.req.param("id");
    const competitionId = c.req.param("competitionId")!;

    const { error } = await deleteInvite(competitionId, id);
    if (error) return c.json({ message: error }, 500);

    return c.body(null, 200);
});