import { Hono } from "hono";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./assets";
export const organizationsRouter = new Hono<AppEnv>().basePath("/:orgName");

organizationsRouter.route("/landmarks", landmarksRouter);
organizationsRouter.route("/quests", questsRouter);
organizationsRouter.route("/assets", assetsRouter);
