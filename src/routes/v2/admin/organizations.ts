import { Hono } from "hono";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./assets";
import { uploadsRouter } from "./uploads";
import { competitionsRouter } from "./competitions/competitions";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

organization.route("/landmarks", landmarksRouter);
organization.route("/quests", questsRouter);
organization.route("/competitions", competitionsRouter);
organization.route("/uploads", uploadsRouter);
