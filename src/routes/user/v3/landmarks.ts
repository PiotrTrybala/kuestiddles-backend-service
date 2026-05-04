import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const landmarksRouter = new Hono<AppEnv>();

landmarksRouter.get("/search", async (c) => {
    return c.body(null, 501)
});

landmarksRouter.get("/:id", async (c) => {
    return c.body(null, 501)
});

landmarksRouter.post("/visit", async (c) => {
    return c.body(null, 501)
});