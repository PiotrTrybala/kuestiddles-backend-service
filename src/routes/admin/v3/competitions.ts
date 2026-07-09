// `/:id{${UUID_PATTERN}}`

import type { AppEnv } from "@/config/app";
import { createInvite, getInvite, getInvites, removeInvite } from "@/controllers/invites";
import { checkCompetitionSlug, createCompetition, createGroup, deleteCompetitionById, deleteCompetitionBySlug, deleteGroupById, deleteGroupBySlug, getCompetitionById, getCompetitionBySlug, getGroupById, getGroupBySlug, getUsers, searchCompetitions, searchGroups, updateCompetitionById } from "@/repositories/v3/competitions";
import { UUID_PATTERN } from "@/globals";
import { requireOrganization } from "@/routes/middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { getLeaderboard, updateLeaderboard } from "@/controllers/leaderboard";
import type { ContentfulStatusCode, ContentlessStatusCode } from "hono/utils/http-status";
import { handleValidationError } from "./v3";
import { createInvitation, deleteInvitation, getInvitation } from "@/controllers/invites2";

// Competition router - /competitions

export const competitionsRouter = new Hono<AppEnv>();
competitionsRouter.use("*", requireOrganization);

competitionsRouter.get("/search", zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
}), handleValidationError), async (c) => {
    const { id } = c.get("organization")!;
    const { page, pageSize, name } = c.req.valid("query");

    const { competitions, error } = await searchCompetitions(id, page, pageSize, { name });
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json({ competitions })
});

competitionsRouter.get(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
}), handleValidationError), async (c) => {

    const { id } = c.req.valid("param");

    const { competition, error } = await getCompetitionById(id);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    const { leaderboard, error: e} = await getLeaderboard(competition!.id);
    if (e) {
        const { message, status } = e;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json({ competition, leaderboard });
});


competitionsRouter.get("/:slug", zValidator("param", z.object({
    slug: z.string().max(64, { error: "Max length of slug is 64 characters" }),
}), handleValidationError), async (c) => {
    const organization = c.get("organization")!;
    const { slug } = c.req.valid("param");

    const { competition, error } = await getCompetitionBySlug(organization.id, slug);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json(competition);
});

competitionsRouter.delete(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
}), handleValidationError), async (c) => {
    
    const { id } = c.req.valid("param");
    
    const { deleted, error } = await deleteCompetitionById(id);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json({ deleted });
});

competitionsRouter.delete("/:slug", zValidator("param", z.object({
    slug: z.string(),
}), handleValidationError), async (c) => {
    const { id } = c.get("organization")!;
    const { slug } = c.req.valid("param");
    
    const { deleted, error } = await deleteCompetitionBySlug(id, slug);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }
    
    return c.json({ deleted });
});

competitionsRouter.patch(`/:id{${UUID_PATTERN}}`, zValidator("json", z.object({
    name: z.string().max(64, { error: "Name is too long (max 64 characters)" }).optional(),
    status: z.enum(["onboarding", "in-progress", "finishing", "archived"]).optional(),
    finishedAt: z.date().refine((date) => date > new Date(), {
        error: "Date must be in the future",
    }).optional(),
}), handleValidationError), zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    
    const { name, status, finishedAt } = c.req.valid("json");
    const { id } = c.req.valid("param");
    
    const { competition, error } = await updateCompetitionById(id, name, status, finishedAt);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }
    
    return c.json(competition);
});


competitionsRouter.post("/", zValidator("json", z.object({
    gameId: z.uuid(),
    name: z.string().max(64, { error: "Name is too long (max 64 characters)" }),
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters" }).optional(),
    finishesAt: z.date().optional(),
}), handleValidationError), async (c) => {
    const { id } = c.get("organization")!;
    const { gameId, name, slug, finishesAt } = c.req.valid("json");
    
    // TODO: Add checking slug if it is vacant
    const { competition, error } = await createCompetition(id, gameId, name, slug, finishesAt);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }


    return c.json(competition);
});

// Group router - /competitions/:competitionId/groups

competitionsRouter.get("/:competitionId/groups/search", zValidator("param", z.object({
    competitionId: z.uuid(),
}), handleValidationError), zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
}), handleValidationError), async (c) => {
    const { competitionId } = c.req.valid("param");
    const { page, pageSize, name } = c.req.valid("query");

    const { groups, error } = await searchGroups(competitionId, page, pageSize, { name });
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json({ groups });
});

competitionsRouter.get(`/:competitionId/groups/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    competitionId: z.uuid(),
    id: z.uuid(),
}), handleValidationError), async (c) => {
    const { competitionId, id } = c.req.valid("param");

    const { group, error } = await getGroupById(id);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json(group);
});

competitionsRouter.get(`/:competitionId/groups/:id{${UUID_PATTERN}}/users`, zValidator("param", z.object({
    competitionId: z.uuid(),
    id: z.uuid(),
}), handleValidationError), async (c) => {

    const { competitionId, id } = c.req.valid("param");

    const { users, error } = await getUsers(id);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json(users);
});

competitionsRouter.get("/:competitionId/groups/:slug", zValidator("param", z.object({
    competitionId: z.uuid(),
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters)" }),
}), handleValidationError), async (c) => {
    const { id } = c.get("organization")!;
    const { competitionId, slug } = c.req.valid("param");

    const { group, error } = await getGroupBySlug(competitionId, slug);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json(group);
});

competitionsRouter.delete(`/:competitionId/groups/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
    competitionId: z.uuid(),
}), handleValidationError), async (c) => {

    const { id } = c.req.valid("param");
    
    const { deleted, error } = await deleteGroupById(id);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }
    
    return c.json({ deleted });
});

competitionsRouter.delete("/:competitionId/groups/:slug", zValidator("param", z.object({
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters)" }),
    competitionId: z.uuid(),
}), handleValidationError), async (c) => {
    const { id } = c.get("organization")!;
    const { competitionId, slug } = c.req.valid("param");
    
    const { deleted, error } = await deleteGroupBySlug(competitionId, slug);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json({ deleted });
});

competitionsRouter.post("/:competitionId/groups", zValidator("json", z.object({
    name: z.string().max(64, { error: "Name is too long (max 64 characters)" }),
    slug: z.string().max(64, { error: "Slug is too long (max 64 characters)" }).optional(),
}), handleValidationError), zValidator("param", z.object({
    competitionId: z.uuid(),
}), handleValidationError), async (c) => {

    const { competitionId } = c.req.valid("param");
    const { name, slug } = c.req.valid("json");

    const { group, error } = await createGroup(competitionId, name, slug);
    if (error) {
        const { message, status } = error;
        console.log(message, status);
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    const { updated, error: e } = await updateLeaderboard(competitionId, group!.id, 0);

    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    console.log(`Updated leaderboard entry for group: ${group!.id}, ${updated}`)

    return c.json(group);
});

// Invites router - /competitions/:competitionId/invites

competitionsRouter.get(`/:competitionId/invites/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
    competitionId: z.uuid(),
}), handleValidationError), async (c) => {

    const { id, competitionId } = c.req.valid("param");
    // TODO: Update returned error type here
    const { invite, error } = await getInvitation(competitionId, id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(invite);
});

competitionsRouter.get(`/:competitionId/leaderboard`, zValidator("param", z.object({
    competitionId: z.uuid(),
}), handleValidationError), async (c) => {
    
    const { competitionId } = c.req.valid("param");

    const { leaderboard, error } = await getLeaderboard(competitionId)
        if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json(leaderboard);
});

competitionsRouter.post("/:competitionId/invites", zValidator("json", z.object({
    groupId: z.string(),
    expiresIn: z.number().min(0, { error: "expiresIn must be greater than 0" }).default(60),
})), zValidator("param", z.object({
    competitionId: z.uuid(),
}), handleValidationError), async (c) => {

    const { competitionId } = c.req.valid("param");
    const { groupId, expiresIn } = c.req.valid("json");

    const { invite, error } = await createInvitation({ competitionId, groupId, expiresIn });
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    console.log("Invitation: ", invite);

    return c.json({
        token: invite!.invitationToken,
    });
});

competitionsRouter.delete(`/:competitionId/invites/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    competitionId: z.uuid(),
    id: z.uuid(),
}), handleValidationError), async (c) => {
    const { competitionId, id } = c.req.valid("param");

    const { deleted, error } = await deleteInvitation(competitionId, id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    
    return c.json({ deleted });
});