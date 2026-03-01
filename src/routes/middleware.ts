import type { AppEnv } from "../config/app";
import { createMiddleware } from "hono/factory";


// export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {

//     const user = c.get("user");

//     if (!user) return c.json({ message: "Unauthorized" }, 401);
//     if (user.role !== "user") return c.json({ message: "Forbidden" }, 403);

//     await next();
// });

export const requireAuth = (role: "user" | "admin" | "none") => {
    return createMiddleware<AppEnv>(async (c, next) => {
        await next();
    });
};