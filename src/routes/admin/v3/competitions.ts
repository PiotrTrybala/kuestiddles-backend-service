// `/:id{${UUID_PATTERN}}`

import type { AppEnv } from "@/config/app";
import { UUID_PATTERN } from "@/routes/api";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

// Competition router - /competitions

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.get(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    return c.body(null, 200);
});

competitionsRouter.get("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    return c.body(null, 200);
});

competitionsRouter.delete(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    return c.body(null, 200);
});

competitionsRouter.delete("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    return c.body(null, 200);
});

competitionsRouter.patch(`/:id{${UUID_PATTERN}}`, zValidator("json", z.object({
    fields: z.array(z.object({
        field: z.string(),
        value: z.string().or(z.date()),
    })),
})), zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    return c.body(null, 200);
});

competitionsRouter.get("/search",  zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
    labels: z.string()
        .optional()
        .transform((val) => val && val.trim() !== "" ? val.split(',') : undefined),
})), async (c) => {
    return c.body(null, 200);
});

competitionsRouter.post("/", zValidator("json", z.object({
    gameId: z.uuid(),
    name: z.string(),
    slug: z.string().optional(),
    finishesAt: z.date().optional(),
})), async (c) => {
    return c.body(null, 200);
});

// Group router - /competitions/:competitionId/groups

// Invites router - /competitions/:competitionId/invites