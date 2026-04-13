import { Hono } from "hono";
import type { AppEnv } from "@/config/app";
import { requireOrganization } from "./middleware";
import { extractPagingParams } from "@/routes/utils";
import { deleteUpload, getUploadFile, getUploadMetadata, listUploads, uploadFiles } from "@/repositories/uploads";

import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { uploadsSchema } from "@/routes/validators";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireOrganization);

uploadsRouter.get("/", async (c) => {
    const organization = c.get("organization")!;

    console.log('organization:', organization);

    const { page, pageSize, name, labels } = extractPagingParams(c.req.url);

    const { uploads } = await listUploads(
        organization.id,
        { page, pageSize, name, labels },
    );

    return c.json({
        page, uploads,
    });
});

uploadsRouter.get("/:uploadId/metadata", zValidator('param', z.object({
    uploadId: z.uuid({ error: "Invalid parameter" }),
})), async (c) => {

    const { uploadId } = c.req.valid('param');
    const { metadata, error } = await getUploadMetadata(uploadId);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.json(metadata);
});

uploadsRouter.get("/:uploadId", zValidator('param', z.object({
    uploadId: z.uuid({ error: "Invalid parameter" }),
})), async (c) => {

    const { uploadId } = c.req.valid('param');
    const { upload, error } = await getUploadFile(uploadId);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.body(upload!.stream(), {
        headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000'
        }
    });
});



uploadsRouter.post("/", zValidator('form', uploadsSchema), async (c) => {

    const organization = c.get("organization")!;
    const member = c.get("membership")!;

    const { uploads } = c.req.valid('form');
    if (uploads.length === 0) return c.json({ message: "0 uploads found." }, 400);

    const { results, error } = await uploadFiles(
        organization.id,
        member.id,
        uploads,
    );
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.json(results);

});

uploadsRouter.delete("/:uploadId", zValidator('param', z.object({
    uploadId: z.uuid({ error: "Invalid parameter" }),
})), async (c) => {

    const { uploadId } = c.req.valid('param');
    const { error } = await deleteUpload(uploadId);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.body(null, 200);
});