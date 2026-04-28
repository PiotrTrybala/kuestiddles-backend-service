import type { AppEnv } from "@/config/app";
import { requireAuth } from "@/routes/middleware";
import { Hono } from "hono";
import { questsRouter } from "./quests";
import { landmarksRouter } from "./landmarks";

export const userRouter = new Hono<AppEnv>();

userRouter.use("*", requireAuth("user"));
userRouter.route("/quests", questsRouter);
userRouter.route("/landmarks", landmarksRouter);