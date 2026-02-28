import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { uploadsRouter } from "./uploads";
import { requireOrganization } from "./middleware";

export const organizationsRouter = new Hono<AppEnv>();

organizationsRouter.use("*", requireOrganization);

organizationsRouter.route("/:slug/landmarks", landmarksRouter);
organizationsRouter.route("/:slug/quests", questsRouter);
organizationsRouter.route("/:slug/uploads", uploadsRouter);
