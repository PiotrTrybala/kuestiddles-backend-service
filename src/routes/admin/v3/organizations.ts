import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { uploadsRouter } from "./uploads";
import { requireAuth } from "@/routes/middleware";
import { auth } from "@/config/auth";
import slugify from "slugify";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

organizationsRouter.post("/create", requireAuth("admin"), async (c) => {

    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);

    const { name } = await c.req.json();

    const slug = slugify(name, { lower: true, trim: true });

    const organization = await auth.api.createOrganization({
        body: { name, slug, },
        headers: c.req.header,
    });

    return c.json({
        organizationId: organization?.id,
    })
});

organization.route("/uploads", uploadsRouter);