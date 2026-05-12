import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const questsRouter = new Hono<AppEnv>();

questsRouter.get("/search", async (c) => {
    return c.body(null, 501);
});

questsRouter.get("/:id", async (c) => {
    return c.body(null, 501);
});

questsRouter.get("/solve", async (c) => {
    return c.body(null, 501);
});