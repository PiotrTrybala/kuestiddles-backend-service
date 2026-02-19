import { createMiddleware } from "hono/factory";
import { type AppEnv } from "../../config/app";

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {

    const user = c.get("user");

    if (!user) return c.json({ message: "Unauthorized" }, 401);
    if (user.role !== "user") return c.json({ message: "Forbidden" }, 403);

    await next();
});