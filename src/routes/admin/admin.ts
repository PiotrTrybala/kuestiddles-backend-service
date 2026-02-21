import { Hono } from "hono";

import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { requireAdmin } from "./middleware";
import { assetsRouter } from "./assets";

export const admin = new Hono();

admin.use("*", requireAdmin);

admin.route("/landmarks", landmarksRouter);
admin.route("/quests", questsRouter);
admin.route("/assets", assetsRouter);