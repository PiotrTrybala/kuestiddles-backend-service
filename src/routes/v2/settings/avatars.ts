import { Hono } from "hono";
import type { AppEnv } from "@/config/app";
import { zValidator } from "@hono/zod-validator";
import z, { uuid } from "zod";

export const avatarsRouter = new Hono<AppEnv>();

avatarsRouter.get("/:userId", zValidator('param', z.object({
    userId: uuid(),
})), async (c) => {

    const { userId } = c.req.valid('param');

    



});