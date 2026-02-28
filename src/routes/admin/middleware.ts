import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import {type AppEnv } from "../../config/app";
import { database } from "../../database/db";
import { organizations } from "../../database/schema/organizations";

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {

    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized"}, 401);
    if (user.role !== "admin") return c.json({ message: "Forbidden"}, 403);

    await next();
});

export const requireOrganization = createMiddleware<AppEnv>(async (c, next) => {

    const user = c.get("user");

    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }

    const organizationName = c.req.param("orgName");

    if (!organizationName) return c.notFound();

    const organization = await database.query.organizations.findFirst({
        where: and(
            eq(organizations.name, organizationName!.toLowerCase()),
            eq(organizations.user_id, user.id)
        )
    })

    if (!organization) return c.json({ message: "Forbidden" }, 403);

    c.set("organization", organization);

    await next();
}); 