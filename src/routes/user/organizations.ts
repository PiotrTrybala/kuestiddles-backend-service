import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

// USER ROUTES: Only for authenticated users (role = user) and for entities in organizations

organization.route("/landmarks", landmarksRouter);
organization.route("/quests", questsRouter);

// USER ROUTES: Only for authenticated users (role = user)

// GENERAL ROUTES: To be accessed by anyone

// Assets

