import type { AppEnv } from "@/config/app";
import { UUID_PATTERN } from "@/globals";
import { getUploadDataById, getUploadMetadataById, getUploadMetadataBySlug, removeUploadById, removeUploadBySlug, searchUploads, uploadUploads } from "@/repositories/v3/uploads";
import { requireOrganization } from "@/routes/middleware";
import { uploadsSchema } from "@/routes/validators";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireOrganization);

uploadsRouter.get("/search", zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
    labels: z.string()
        .optional()
        .transform((val) => val && val.trim() !== "" ? val.split(',') : undefined),
}),(result, c) => {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}), async (c) => {

    const organization = c.get("organization")!;
    const { page, pageSize, name, labels } = c.req.valid('query');

    const { uploads, error } = await searchUploads(
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
        uploads: uploads,
    });
});

uploadsRouter.post("/", zValidator('form', uploadsSchema, (result, c) => {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}), async (c) => {

    const organization = c.get("organization")!;
    const { uploads } = c.req.valid("form");

    console.log('uploaded uploads:', uploads);

    if (uploads.length === 0) return c.json({ message: "0 uploads found." }, 400);

    const { uploads: uploadsResults, error } = await uploadUploads(
        organization.id,
        uploads,
    );
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json(uploadsResults);
});

uploadsRouter.get(`/:id{${UUID_PATTERN}}/metadata`, zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
}), (result, c) => {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}), async (c) => {

    const { id } = c.req.valid('param');

    const { metadata, error } = await getUploadMetadataById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(metadata);

});

uploadsRouter.get(`/:id{${UUID_PATTERN}}/data`, zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
}), (result, c) => {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}), async (c) => {

    const { id } = c.req.valid('param');

    const { data, error } = await getUploadDataById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.body(data!.stream(), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
        }
    });
});

uploadsRouter.get("/:slug/metadata", zValidator('param', z.object({
    slug: z.string({ error: "invalid parameter" }),
}), (result, c) => {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}), async (c) => {
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

uploadsRouter.delete(`/:id{${UUID_PATTERN}}`, zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
}), (result, c) => {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}), async (c) => {
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
}),(result, c) => {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}), async (c) => {
    const organization = c.get("organization")!;
    const { slug } = c.req.valid("param");

    const { deleted, error } = await removeUploadBySlug(organization.id, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({
        deleted,
    });
});

