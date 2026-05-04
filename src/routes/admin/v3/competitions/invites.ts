import type { AppEnv } from "@/config/app";
import { requireAuth } from "@/routes/middleware";
import { Hono } from "hono";

export const invitesRouter = new Hono<AppEnv>();

invitesRouter.use("*", requireAuth("admin"));

invitesRouter.get("/search", async (c) => {
    return c.body(null, 501)
});

invitesRouter.post("/", async (c) => {
    return c.body(null, 501)
});

invitesRouter.delete("/:id", async (c) => {
    return c.body(null, 501)
});