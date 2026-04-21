import type { AppEnv } from "@/config/app";
import { createQuest } from "@/repositories/quests";
import { getUploadDataById, getUploadMetadataById, getUploadMetadataBySlug, removeUploadById, removeUploadBySlug, searchUploads, upload } from "@/repositories/v3/uploads";
import { requireOrganization } from "@/routes/v2/admin/middleware";
import { uploadsSchema } from "@/routes/validators";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireOrganization);

uploadsRouter.get("/search", zValidator('param', z.object({
    page: z.coerce.number(),
    pageSize: z.coerce.number(),
    name: z.string(),
    labels: z.string().transform((value) => value.split(',')),
})), async (c) => {

    const organization = c.get("organization")!;
    const { page, pageSize, name, labels } = c.req.valid('param');

    const { results, error } = await searchUploads(
        organization.id,
        page,
        pageSize,
        name,
        labels,
    );

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({
        results,
    });
});

uploadsRouter.get("/:id/metadata", zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
})), async (c) => {

    const { id } = c.req.valid('param');

    const { metadata, error } = await getUploadMetadataById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(metadata);

});

uploadsRouter.get("/:id", zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
})), async (c) => {

    const { id } = c.req.valid('param');

    const { file, error } = await getUploadDataById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.body(file!.stream(), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
        }
    });
});

uploadsRouter.get("/:slug/metadata", zValidator('param', z.object({
    slug: z.string({ error: "invalid parameter" }),
})), async (c) => {
    const organization = c.get("organization")!;
    const { slug } = c.req.valid('param');

    const { metadata, error } = await getUploadMetadataBySlug(organization.id, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(metadata);
});

uploadsRouter.get("/:slug", zValidator('param', z.object({
    slug: z.string({ error: "invalid parameter" }),
})), async (c) => {
    const organization = c.get("organization")!;
    const { slug } = c.req.valid('param');

    const { file, error } = await getUploadMetadataBySlug(organization.id, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.body(file!.stream(), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
        }
    });
});

uploadsRouter.post("/", zValidator('form', uploadsSchema), async (c) => {

    const organization = c.get("organization")!;
    const { uploads } = c.req.valid("form");
    if (uploads.length === 0) return c.json({ message: "0 uploads found." }, 400);

    const { results, error } = await upload(
        organization.id,
        uploads,
    );
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json(results);
});

uploadsRouter.delete("/:id", zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { error } = await removeUploadById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.body(null, 200);
});

uploadsRouter.delete("/:slug", zValidator('param', z.object({
    slug: z.string({ error: "invalid parameter" }),
})), async (c) => {
    const organization = c.get("organization")!;
    const { slug } = c.req.valid("param");

    const { error } = await removeUploadBySlug(organization.id, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.body(null, 200);
});

