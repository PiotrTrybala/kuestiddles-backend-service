import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./uploads";
import { requireOrganization } from "./middleware";
import { database } from "../../database/db";

export const organizationsRouter = new Hono<AppEnv>();


organizationsRouter.get("/list", async (c) => {
    const user = c.get("user")!;

    const result = await database.select().from(organizations).where(eq(organizations.user_id, user.id));
    return c.json({
        organizations: result,
    })
});

type OrganizationCreate = {
    name: string,
};

organizationsRouter.post("/", async (c) => {
    const body = await c.req.json<OrganizationCreate>();

    const existing = await database.query.organization.findFirst({
        where: eq(organizations.name, body.name)
    });

    if (existing) {
        return c.json({ message: "Organization with this name has been created" }, 400);
    }

    await database.insert(organizations).values({
        name: body.name,
    }).returning();

    return c.json({
        message: "Created new organization",
    }, 200);
});

organizationsRouter.use("*", requireOrganization);

organizationsRouter.route("/:orgName/landmarks", landmarksRouter);
organizationsRouter.route("/:orgName/quests", questsRouter);
organizationsRouter.route("/:orgName/assets", assetsRouter);
