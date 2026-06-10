// `/:id{${UUID_PATTERN}}`

import type { AppEnv } from "@/config/app";
import { createInvite, getInvite, getInvites, removeInvite } from "@/controllers/invites";
import { checkCompetitionSlug, createCompetition, createGroup, deleteCompetitionById, deleteCompetitionBySlug, deleteGroupById, deleteGroupBySlug, getCompetitionById, getCompetitionBySlug, getGroupById, getGroupBySlug, searchCompetitions, searchGroups, updateCompetitionById } from "@/repositories/v3/competitions";
import { UUID_PATTERN } from "@/globals";
import { requireOrganization } from "@/routes/middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { getLeaderboard } from "@/controllers/leaderboard";

// Competition router - /competitions

export const competitionsRouter = new Hono<AppEnv>();
competitionsRouter.use("*", requireOrganization);

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

    const { leaderboard, error: e} = await getLeaderboard(competition!.id);
    if (e) {
        return c.json({
            message: e,
        }, 500);
    }

    return c.json({ competition, leaderboard });
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
    
    const { deleted, error } = await deleteCompetitionBySlug(id, slug);
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


competitionsRouter.post("/", zValidator("json", z.object({
    gameId: z.uuid(),
    name: z.string().max(64, { error: "Name is too long (max 64 characters)" }),
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters" }).optional(),
    finishesAt: z.date().optional(),
})), async (c) => {
    const { id } = c.get("organization")!;
    const { gameId, name, slug, finishesAt } = c.req.valid("json");
    
    // TODO: Add checking slug if it is vacant
    const { competition, error } = await createCompetition(id, gameId, name, slug, finishesAt);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }


    return c.json(competition);
});

// Group router - /competitions/:competitionId/groups

competitionsRouter.get(`/:competitionId/groups/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    competitionId: z.uuid(),
    id: z.uuid(),
})), async (c) => {
    const { competitionId, id } = c.req.valid("param");

    const { group, error } = await getGroupById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json(group);
});

competitionsRouter.get("/:competitionId/groups/:slug", zValidator("param", z.object({
    competitionId: z.uuid(),
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters)" }),
})), async (c) => {
    const { id } = c.get("organization")!;
    const { competitionId, slug } = c.req.valid("param");

    const { group, error } = await getGroupBySlug(competitionId, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json(group);
});

competitionsRouter.delete(`/:competitionId/groups/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
    competitionId: z.uuid(),
})), async (c) => {

    const { id } = c.req.valid("param");
    
    const { deleted, error } = await deleteGroupById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    
    return c.json({ deleted });
});

competitionsRouter.delete("/:competitionId/groups/:slug", zValidator("param", z.object({
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters)" }),
    competitionId: z.uuid(),
})), async (c) => {
    const { id } = c.get("organization")!;
    const { competitionId, slug } = c.req.valid("param");
    
    const { deleted, error } = await deleteGroupBySlug(competitionId, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    
    return c.json({ deleted });
});

competitionsRouter.get("/:competitionId/groups/search", zValidator("param", z.object({
    competitionId: z.uuid(),
})), zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
})), async (c) => {
    const { competitionId } = c.req.valid("param");
    const { page, pageSize, name } = c.req.valid("query");

    const { groups, error } = await searchGroups(competitionId, page, pageSize, { name });
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({ groups });
});

competitionsRouter.post("/:competitionId/groups", zValidator("json", z.object({
    name: z.string().max(64, { error: "Name is too long (max 64 characters)" }),
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters)" }).optional(),
})), zValidator("param", z.object({
    competitionId: z.uuid(),
})), async (c) => {

    const { competitionId } = c.req.valid("param");
    const { name, slug } = c.req.valid("json");

    const { group, error } = await createGroup(competitionId, name, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json(group);
});

// Invites router - /competitions/:competitionId/invites

competitionsRouter.get("/:competitionId/invites", zValidator("param", z.object({
    competitionId: z.uuid(),
})), async (c) => {
    const { competitionId } = c.req.valid("param");

    const { invites, error } = await getInvites(competitionId);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({ invites });
});

competitionsRouter.get(`/:competitionId/invites/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
    competitionId: z.uuid(),
})), async (c) => {

    const { id, competitionId } = c.req.valid("param");

    const { invite, error } = await getInvite(competitionId, id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json(invite);
});

competitionsRouter.post("/:competitionId/invites", zValidator("json", z.object({
    groupId: z.string(),
    expiresIn: z.number().min(0, { error: "expiresIn must be greater than 0" }).default(60),
})), zValidator("param", z.object({
    competitionId: z.uuid(),
})), async (c) => {

    const { competitionId } = c.req.valid("param");
    const { groupId, expiresIn } = c.req.valid("json");

    const { invite, error } = await createInvite({ competitionId, groupId, expiresIn });
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(invite);
});

competitionsRouter.delete(`/:competitionId/invite/:inviteid{${UUID_PATTERN}}`, zValidator("param", z.object({
    competitionId: z.uuid(),
    inviteId: z.uuid(),
})), async (c) => {
    const { competitionId, inviteId } = c.req.valid("param");

    const { deleted, error } = await removeInvite(competitionId, inviteId);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({ deleted });
});