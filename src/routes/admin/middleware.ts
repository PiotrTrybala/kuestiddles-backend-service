import { createMiddleware } from "hono/factory";
import {type AppEnv } from "../../config/app";
import { auth } from "../../config/auth";

export const requireOrganization = createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    const session = c.get("session");

    if (!user || !session) return c.json({ message: "Unauthorized" }, 401);

    const slug = c.req.param("organizationSlug");

    const organization = await auth.api.getFullOrganization({
        headers: c.req.raw.headers,
        query: {
            organizationSlug: slug,
        },
    });
    if (!organization) return c.json({ message: "Not found or forbidden" }, 403);

    const currentMember = organization.members.find(member => member.userId === user.id);
    if (!currentMember) return c.json({ message: "Forbidden" }, 403);

    c.set("organization", organization);
    c.set("membership", currentMember);

    await next();
}); 