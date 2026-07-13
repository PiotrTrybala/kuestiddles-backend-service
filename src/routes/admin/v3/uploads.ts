import type { AppEnv } from "@/config/app";
import { UUID_PATTERN } from "@/env";
import { requireOrganization } from "@/routes/middleware";
import { imagesSchema } from "@/routes/validators";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import z from "zod";
import { handleValidationError } from "./v3";
import { deleteImageById, getImage, getImageMetadata, searchImages, uploadImages } from "@/repositories/v3/images";
import { meta } from "zod/v4/core";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireOrganization);

uploadsRouter.get("/images/search", zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
    labels: z.string()
        .optional()
        .transform((val) => val && val.trim() !== "" ? val.split(',') : undefined),
}), handleValidationError), async (c) => {

    const organization = c.get("organization")!;
    const { page, pageSize, name, labels } = c.req.valid('query');

    const { images, error } = await searchImages(
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
        images: images,
    });
});

uploadsRouter.post("/images", zValidator('form', imagesSchema, handleValidationError), async (c) => {

    const organization = c.get("organization")!;
    const { images } = c.req.valid("form");

    console.log('uploaded uploads:', images);

    if (images.length === 0) return c.json({ message: "0 uploads found." }, 400);

    const { images: uploadsResults, error } = await uploadImages(
        organization.id,
        images,
    );
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }
    
    return c.json(uploadsResults);
});

uploadsRouter.get(`/images/:id{${UUID_PATTERN}}/metadata`, zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
}), handleValidationError), async (c) => {

    const { id } = c.req.valid('param');

    const { metadata, error } = await getImageMetadata(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({
        id: metadata?.id,
        organizationId: metadata?.organization_id,
        slug: metadata?.slug,
        labels: metadata?.labels,
        hash: metadata?.hash,
        createdAt: metadata?.createdAt,
        updatedAt: metadata?.updatedAt,
    });

});

uploadsRouter.get(`/images/:id{${UUID_PATTERN}}/preview`, zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
}), handleValidationError), async (c) => {

    const { id } = c.req.valid('param');

    const { image, error } = await getImage(id);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.body(image!.stream(), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
        }
    });
});

uploadsRouter.delete(`/images/:id{${UUID_PATTERN}}`, zValidator('param', z.object({
    id: z.uuid({ error: "invalid parameter" }),
}), handleValidationError), async (c) => {
    const { id } = c.req.valid("param");

    const { deleted, error } = await deleteImageById(id);
    if (error) {
        const { message, status } = error;
        return c.json({
            message: message,
        }, status as ContentfulStatusCode);
    }

    return c.json({ deleted, })
});
