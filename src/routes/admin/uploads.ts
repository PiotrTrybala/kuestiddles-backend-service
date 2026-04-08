import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { requireOrganization } from "./middleware";
import { extractPagingParams, parseBodyFiles } from "../utils";
import { deleteUpload, getUploadFile, getUploadMetadata, listUploads, uploadFiles } from "../../repositories/uploads";
import { uploads } from "../../database/schema/uploads";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { meta } from "zod/v4/core";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireOrganization);

uploadsRouter.get("/", async (c) => {
    const organization = c.get("organization")!;

    const { page, pageSize, name, labels } = extractPagingParams(c.req.url);

    const { uploads } = await listUploads(
        organization.id,
        { page, pageSize, name, labels },
    );

    return c.json({
        page, uploads,
    });
});

uploadsRouter.get("/:uploadId/metadata", async (c) => {

    const id = c.req.param("id") || "";
    const { metadata, error } = await getUploadMetadata(id);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.json(metadata);
});

uploadsRouter.get("/:uploadId", async (c) => {

    const id = c.req.param("id") || "";

    const { upload, error } = await getUploadFile(id);
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



uploadsRouter.post("/", async (c) => {

    const organization = c.get("organization")!;
    const member = c.get("membership")!;

    const body = await c.req.parseBody({ all: true });
    const uploads = parseBodyFiles(body);

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

uploadsRouter.delete("/:uploadId", async (c) => {
    const id = c.req.param("id") || "";
    const { error } = await deleteUpload(id);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.body(null, 200);
});