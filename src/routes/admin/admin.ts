import { Hono } from "hono";

import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { requireAdmin } from "./middleware";

// TODO: separate admin and user routes (assets, landmarks, quests, competitions, statistics)

export const admin = new Hono();

admin.use("*", requireAdmin);

admin.route("/landmarks", landmarksRouter);
admin.route("/quests", questsRouter);