import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./assets";
import { requireOrganization } from "./middleware";
import { database } from "../../database/db";
import { organizations } from "../../database/schema/organizations";

export const organizationsRouter = new Hono<AppEnv>();


organizationsRouter.get("/list", async (c) => {
    const user = c.get("user")!;

    const result = await database.select().from(organizations).where(eq(organizations.user_id, user.id));
    return c.json({
        organizations: result,
    })
});

organizationsRouter.use("*", requireOrganization);

organizationsRouter.route("/:orgName/landmarks", landmarksRouter);
organizationsRouter.route("/:orgName/quests", questsRouter);
organizationsRouter.route("/:orgName/assets", assetsRouter);
