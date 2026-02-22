import { eq } from "drizzle-orm";
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

    const name = c.req.param("orgName");
    
    const [ organization ] = await database.select()
        .from(organizations)
        .where(eq(organizations.name, name!));

    if (!organization) return c.notFound();

    c.set("organization", organization);

    await next();
}); 