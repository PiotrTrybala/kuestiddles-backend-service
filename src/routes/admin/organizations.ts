import { Hono } from "hono";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./uploads";
import { requireOrganization } from "./middleware";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

organization.route("/landmarks", landmarksRouter);
organization.route("/quests", questsRouter);
organization.route("/assets", assetsRouter);
