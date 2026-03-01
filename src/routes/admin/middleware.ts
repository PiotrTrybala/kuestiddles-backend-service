import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import {type AppEnv } from "../../config/app";
import { database } from "../../database/db";
import { organizations } from "../../database/schema/organizations";
import { auth } from "../../config/auth";

export const requireOrganization = createMiddleware<AppEnv>(async (c, next) => {

    const user = c.get("user");
    const session = c.get("session");

    if (!user || !session) return c.json({ message: "Unauthorized" }, 401);


    const slug = c.req.param("organizationSlug");


    await next();
}); 