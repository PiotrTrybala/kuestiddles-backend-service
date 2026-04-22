import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { uploadsRouter } from "./uploads";
import { requireAuth } from "@/routes/middleware";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

organization.post("/create", requireAuth("admin"), async (c) => {

    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);

    const data = await c.req.json();



});

organization.route("/uploads", uploadsRouter);