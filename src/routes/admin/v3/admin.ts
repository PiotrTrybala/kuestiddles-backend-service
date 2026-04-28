import type { AppEnv } from "@/config/app";
import { requireAuth } from "@/routes/middleware";
import { Hono } from "hono";
import { organizationsRouter } from "./organizations";

export const adminRouter = new Hono<AppEnv>();

adminRouter.route("/v3", organizationsRouter);