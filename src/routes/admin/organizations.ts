import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { type AppEnv } from "../../config/app";
import { landmarksRouter } from "./landmarks";
import { questsRouter } from "./quests";
import { assetsRouter } from "./uploads";
import { requireOrganization } from "./middleware";
import { database } from "../../database/db";
import { organizations } from "../../database/schema/organizations";

export const organizationsRouter = new Hono<AppEnv>();

organizationsRouter.get("/list", async (c) => {
    const user = c.get("user")!;

    const result = await database.select().from(organizations).where(eq(organizations.user_id, user.id));
    return c.json({
        organizations: result,
    });
});

organizationsRouter.get("/:name", async (c) => {

    const user = c.get("user")!;
    const name = c.req.param("name");

    const [ organization ] = await database.select()
        .from(organizations)
        .where(and(eq(organizations.user_id, user.id), eq(organizations.name, name)));

    if (!organization) {
        return c.notFound();
    }

    return c.json(organization);

});

type OrganizationCreate = {
    name: string,
};

organizationsRouter.post("/", async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json<OrganizationCreate>();

    const existing = await database.query.organizations.findFirst({
        where: and(eq(organizations.name, body.name), eq(organizations.user_id, user.id))
    });

    if (existing) {
        return c.json({ message: "Organization with this name has been created" }, 400);
    }

    try {
        const [organization] = await database.insert(organizations).values({
            user_id: user.id,
            name: body.name,
        }).returning();

        console.log(organization);

    } catch (error) {
        console.error(error);
        return c.json({ message: "Could not create new organization" }, 500);
    }


    return c.json({
        message: "Created new organization",
    }, 200);
});

organizationsRouter.use("*", requireOrganization);

organizationsRouter.route("/:orgName/landmarks", landmarksRouter);
organizationsRouter.route("/:orgName/quests", questsRouter);
organizationsRouter.route("/:orgName/assets", assetsRouter);
