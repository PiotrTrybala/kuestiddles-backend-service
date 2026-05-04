import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const groupsRouter = new Hono<AppEnv>();

groupsRouter.get("/search", async (c) => {
    return c.body(null, 501)
});

groupsRouter.get("/:id", async (c) => {
    return c.body(null, 501)
});

groupsRouter.get("/slug/:slug", async (c) => {
    return c.body(null, 501)
});

groupsRouter.get("/:id/users", async (c) => {
    return c.body(null, 501)
});

groupsRouter.post("/", async (c) => {
    return c.body(null, 501)
});

groupsRouter.delete("/:id", async (c) => {
    return c.body(null, 501)
});

groupsRouter.delete("/slug/:slug", async (c) => {
    return c.body(null, 501)
});