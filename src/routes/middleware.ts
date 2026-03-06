import type { AppEnv } from "../config/app";
import { createMiddleware } from "hono/factory";
import { auth } from "../config/auth";

export const requireAuth = (role: "user" | "admin" | "none") => {
    console.log('require auth:', role);
    return createMiddleware<AppEnv>(async (c, next) => {
        console.log('require auth middleware with:', role);
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (!session) return c.json({ message: "Unauthorized"}, 401);

        c.set("session", session.session);
        c.set("user", session.user);
        
        if (role != "none") {
            if (session.user.role !== role) return c.json({ message: "Forbidden" }, 403);
        }

        const organizationSlug = c.req.param("organizationSlug");
        console.log("organizationSlug:", organizationSlug, c.req.param(), c.req.raw.url);
        c.set("organizationSlug", organizationSlug);

        console.log(c.get("organizationSlug"));

        await next();
    });
};