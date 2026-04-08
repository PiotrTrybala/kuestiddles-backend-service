import { Hono } from "hono";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./assets";
import { uploadsRouter } from "./uploads";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

organization.route("/landmarks", landmarksRouter);
organization.route("/quests", questsRouter);

organization.route("/uploads", uploadsRouter);
