import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { settingsRouter } from "./settings";
import { statisticsRouter } from "./statistics";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

// USER ROUTES: Only for authenticated users (role = user) and for entities in organizations

organization.route("/landmarks", landmarksRouter);
organization.route("/quests", questsRouter);

// USER ROUTES: Only for authenticated users (role = user)

organizationsRouter.route("/settings", settingsRouter);
organizationsRouter.route("/statistics", statisticsRouter);

// GENERAL ROUTES: To be accessed by anyone

// Assets

