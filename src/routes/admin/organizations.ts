import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { uploadsRouter } from "./uploads";
import { requireOrganization } from "./middleware";

export const organizationsRouter = new Hono<AppEnv>();

organizationsRouter.use("*", requireOrganization);

organizationsRouter.route("/:organizationSlug/landmarks", landmarksRouter);
organizationsRouter.route("/:organizationSlug/quests", questsRouter);
organizationsRouter.route("/:organizationSlug/uploads", uploadsRouter);
