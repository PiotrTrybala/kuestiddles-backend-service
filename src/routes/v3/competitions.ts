import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.get("/groups/current", async (c) => {
    return c.body(null, 501)
});

competitionsRouter.post("/groups/solve", async (c) => {
    return c.body(null, 501)
});

competitionsRouter.get("/groups/accept", async (c) => {
    return c.body(null, 501)
});