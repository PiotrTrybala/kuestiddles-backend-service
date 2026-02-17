import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { assets } from "../database/schema/kuestiddles";
import { database } from "../database/db";
import { s3 } from "../config/s3";

export const assetsRouter = new Hono();


assetsRouter.get("/list", async (c) => {

    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);

    const offset = page * pageSize;
    const limit = offset + pageSize;

    const result = await database.select().from(assets).offset(offset).limit(limit);

    return c.json({
        page: page,
        assets: result,
    });
});

assetsRouter.get("/:id", async (c) => {

    const id = c.req.param("id");

    const result = await database.select().from(assets).where(eq(assets.id, id));

    const [ asset ] = result;

    const image = s3.file(asset!.path, {
        bucket: process.env.AWS_BUCKET_NAME!,
    });

    const exists = await image.exists();
    if (!exists) return c.notFound();

    const data = await image.arrayBuffer();
    return c.body(data, 200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
    });
});

assetsRouter.post("/upload", (c) => {
    return c.json({ placeholder: true });
});

assetsRouter.delete("/:id", (c) => {
    return c.json({ placeholder: true });
});