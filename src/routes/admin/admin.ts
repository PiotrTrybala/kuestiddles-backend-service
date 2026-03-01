import { Hono } from "hono";

import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { requireOrganization } from "./middleware";
import { assetsRouter } from "./uploads";
import { admin } from "better-auth/plugins";
import { organizationsRouter } from "./organizations";

export const adminRouter = new Hono();

adminRouter.use("*", requireOrganization);
adminRouter.route("/organizations", organizationsRouter);