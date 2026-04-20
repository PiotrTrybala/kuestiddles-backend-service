import type { AppEnv } from "@/config/app";
import { requireOrganization } from "@/routes/v2/admin/middleware";
import { uploadsSchema } from "@/routes/validators";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireOrganization);

uploadsRouter.get("/search", async (c) => {

});

uploadsRouter.get("/:id/metadata", zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
})), async (c) => {

});

uploadsRouter.get("/:id", zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
})), async (c) => {

});

uploadsRouter.get("/:slug/metadata", zValidator('param', z.object({
    slug: z.string({ error: "invalid parameter" }),
})), async (c) => {

});

uploadsRouter.get("/:slug", zValidator('param', z.object({
    slug: z.string({ error: "invalid parameter" }),
})), async (c) => {

});

uploadsRouter.post("/", zValidator('form', uploadsSchema), async (c) => {

});

uploadsRouter.delete("/:id", zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
})), async (c) => {

});

uploadsRouter.delete("/:slug", zValidator('param', z.object({
    slug: z.string({ error: "invalid parameter" }),
})), async (c) => {

});

