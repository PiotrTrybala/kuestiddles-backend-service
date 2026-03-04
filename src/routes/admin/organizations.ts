import { Hono } from "hono";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./uploads";
import { requireOrganization } from "./middleware";

export const organizationsRouter = new Hono<AppEnv>();

organizationsRouter.get("/list", async (c) => {
    return c.json({ message: "Not Implemented" }, 501);
});

organizationsRouter.post("/", async (c) => {
    return c.json({ message: "Not Implemented" }, 501);
});

const sluggedGroup = organizationsRouter.basePath("/:organizationSlug");

sluggedGroup.use("*", requireOrganization);

sluggedGroup.route("/landmarks", landmarksRouter);
sluggedGroup.route("/quests", questsRouter);
sluggedGroup.route("/assets", assetsRouter);
