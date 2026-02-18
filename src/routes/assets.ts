import { Hono } from "hono";
import { eq, ilike, arrayOverlaps, and } from "drizzle-orm";
import { sha256 } from "hono/utils/crypto";
import sharp from "sharp";

import { assets } from "../database/schema/kuestiddles";
import { database } from "../database/db";
import { s3 } from "../config/s3";
import { type AppEnv } from "../config/app";
import { requireAdmin } from "./admin/admin";

export const assetsRouter = new Hono<AppEnv>();

// TODO: Add more search options to GET /list routes
// TODO: Change naming of asset from hash to something more human readable
// TODO: Add better error handling

assetsRouter.get("/list", requireAdmin, async (c) => {

    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);
    const labels = (c.req.query("labels") || "")
        .split(",")
        .map(l => l.trim())
        .filter(Boolean);

    const name = c.req.query("name");

    const offset = page * pageSize;
    const limit = pageSize;

    const conditions = [];

    if (name && name.trim() !== "") {
        conditions.push(ilike(assets.name, `%${name}%`));
    }
    
    if (labels.length > 0) {
        conditions.push(arrayOverlaps(assets.labels, labels));
    }
    
    const result = await database.select()
        .from(assets)
        .where(conditions.length ? and(...conditions) : undefined)
        .offset(offset)
        .limit(limit);

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
    if (result.length == 0) return c.notFound();

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

    console.log("raw assets:", rawAssets);

    const assetsFiles: File[] = Array.isArray(rawAssets) ? rawAssets.filter((f): f is File => f instanceof File) : rawAssets instanceof File ? [rawAssets] : [];

    if (assetsFiles.length == 0) {
        return c.json({ message: "No assets uploaded" }, 400);
    }

    console.log(assetsFiles);

    const uploadResults = await Promise.all(
        assetsFiles.map(async (asset) => {
            const arrayBuffer = await asset.arrayBuffer();

            const webpBuffer = await sharp(arrayBuffer)
                .webp({ quality: 75 })
                .resize(800, null, { withoutEnlargement: true })
                .toBuffer();



            const hash = await sha256(webpBuffer);
            const assetName = `${asset.name}.webp`;
            const hashedName = await sha256(assetName);
            const assetPath = `assets/${hashedName}`;

            console.log(`${assetName} : ${assetPath}`);

            try {
                const s3Res = await s3.write(assetPath, webpBuffer, {
                    type: "image/webp",
                });
                console.log(s3Res);
            } catch (error) {
                console.error("error detected:", error);
            }

            const [entry] = await database.insert(assets).values({
                name: assetName!,
                path: assetPath!,
                hash: hash!,
            }).returning({ id: assets.id });

            return { id: entry?.id, hash };
        })
    );


    return c.json({ files: uploadResults });
});

assetsRouter.delete("/:id", requireAdmin, async (c) => {

    const id = c.req.param("id");

    const [asset] = await database.select().from(assets).where(eq(assets.id, id));

    if (asset == undefined) return c.notFound();

    try {
        await s3.delete(asset.path);

    } catch(error) {
        console.error("Failed to delete asset:", error);
        return c.json({ message: "Internal server error"}, 500);
    }

    try {
        await database.delete(assets).where(eq(assets.id, id!));
    } catch(error) {
        console.error("Failed to delete asset metadata:", error);
        return c.json({ message: "Internal server error" }, 500);
    }

    return c.json({ message: "Asset deleted" });
});