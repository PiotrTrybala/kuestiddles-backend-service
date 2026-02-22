import { Hono } from "hono";

import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { requireAdmin } from "./middleware";
import { assetsRouter } from "./assets";

export const adminRouter = new Hono();

adminRouter.use("*", requireAdmin);

adminRouter.route("/landmarks", landmarksRouter);
adminRouter.route("/quests", questsRouter);
adminRouter.route("/assets", assetsRouter);