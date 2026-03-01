import type { AppEnv } from "../config/app";
import { createMiddleware } from "hono/factory";
import { auth } from "../config/auth";

export const requireAuth = (role: "user" | "admin" | "none") => {
    return createMiddleware<AppEnv>(async (c, next) => {

        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (!session) return c.json({ message: "Unauthorized"}, 401);

        c.set("session", session.session);
        c.set("user", session.user);
        
        if (role != "none") {
            if (session.user.role !== role) return c.json({ message: "Forbidden" }, 403);
        }

        await next();
    });
};