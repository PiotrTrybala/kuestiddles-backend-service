import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { assets } from "../database/schema/kuestiddles";
import { database } from "../database/db";
import { s3 } from "../config/s3";
import sharp from "sharp";
import { sha256 } from "hono/utils/crypto";

import { type AppEnv } from "../config/app";
import { requireAdmin } from "./admin/admin";

export const assetsRouter = new Hono<AppEnv>();

// TODO: Add middleware (user, group user roles) and (admin role)
// TODO: Add more search options to GET /list routes
// TODO: Change naming of asset from hash to something more human readable
// TODO: Add better error handling

assetsRouter.get("/list", requireAdmin, async (c) => {

    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);

    const offset = page * pageSize;
    const limit = offset + pageSize;

    const result = await database.select().from(assets).offset(offset).limit(limit);

    const extendedAssets = result.map((asset) => {

        const link = `${process.env.ASSETS_URL!}/${asset.id}`;

        return {
            ...asset,
            link,
        };
    });

    return c.json({
        page: page,
        assets: extendedAssets,
    });
});

assetsRouter.get("/:id", async (c) => {

    const id = c.req.param("id");

    const result = await database.select().from(assets).where(eq(assets.id, id));

    const [asset] = result;

    const image = s3.file(asset!.path);

    const exists = await image.exists();
    if (!exists) return c.notFound();

    const data = await image.arrayBuffer();
    return c.body(data, 200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
    });
});

assetsRouter.post("/upload", requireAdmin, async (c) => {

    const form = await c.req.parseBody({ all: true });

    const rawAssets = form['assets'];

    const assetsFiles: File[] = Array.isArray(rawAssets) ? rawAssets.filter((f): f is File => f instanceof File) : rawAssets instanceof File ? [rawAssets] : [];

    if (assetsFiles.length == 0) {
        return c.json({ message: "No assets uploaded" }, 400);
    }

    const uploadResults = await Promise.all(
        assetsFiles.map(async (asset) => {
            const arrayBuffer = await asset.arrayBuffer();

            const webpBuffer = await sharp(arrayBuffer)
                .webp({ quality: 75 })
                .resize(800, null, { withoutEnlargement: true })
                .toBuffer();

            const hash = await sha256(webpBuffer);
            const assetName = await sha256(`${asset.name}.${hash}.webp`);
            const assetPath = `assets/${assetName}`;

            console.log("Asset path:", assetPath);
            try {
                const s3Res = await s3.write(assetPath, webpBuffer, {
                    type: "image/webp",
                });
            } catch (error) {
                console.error("error detected:", error);
            }


            const [entry] = await database.insert(assets).values({
                name: assetName!,
                path: assetPath!,
                hash: hash!,
            }).returning({ id: assets.id });

            console.log(`Asset: ${asset.name}, database result: ${JSON.stringify(entry)}`);

            return { id: entry?.id, hash };
        })
    );


    return c.json({ files: uploadResults });
});

assetsRouter.delete("/:id", requireAdmin, async (c) => {

    const id = c.req.param("id");

    console.log("Asset id:", id);

    const [asset] = await database.select().from(assets).where(eq(assets.id, id));

    if (asset == undefined) return c.notFound();

    await s3.delete(asset.path);

    await database.delete(assets).where(eq(assets.id, id!));


    return c.json({ message: "Asset deleted" });
});