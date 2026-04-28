import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireAuth } from "../middleware";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireAuth("user"));

uploadsRouter.get("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {

});