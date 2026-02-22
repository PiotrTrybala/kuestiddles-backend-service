import { Hono } from "hono";
import { type AppEnv } from "../../config/app";

import { and, arrayOverlaps, eq, ilike } from "drizzle-orm";

import { assets } from "../../database/schema/assets";
import { database } from "../../database/db";
import { s3 } from "../../config/s3";
import sharp from "sharp";
import { sha256 } from "hono/utils/crypto";

export const assetsRouter = new Hono<AppEnv>();

assetsRouter.get("/list", async (c) => {

    const organization = c.get("organization")!;

    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);
    const labels = (c.req.query("labels") || "")
        .split(",")
        .map(l => l.trim())
        .filter(Boolean);

    const name = c.req.query("name");

    const offset = page * pageSize;
    const limit = pageSize;

    const conditions = [
        eq(assets.organization_name, organization.name)
    ];

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

    const fullAssets = result.map((asset) => {
        const url = `${process.env.ASSETS_URL!}/${asset.id}`;
        return {
            ...asset,
            url,
        };
    });

    return c.json({
        page,
        assets: fullAssets,
    });
});

assetsRouter.get("/:id", async (c) => {

    const id = c.req.param("id");

    const result = await database.select().from(assets).where(eq(assets.id, id));
    if (result.length === 0) return c.notFound();

    const [ asset ] = result;

    const image = s3.file(asset!.path);
    if (!(await image.exists())) {
        return c.notFound();
    }

    const data = await image.arrayBuffer();

    return c.body(data, 200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
    });
});

assetsRouter.post("/upload", async (c) => {
    const organization = c.get("organization")!;
    const user = c.get("user")!;
    const form = await c.req.parseBody({ all: true });

    const rawAssets = form['assets'];

    const assetsFiles: File[] = Array.isArray(rawAssets) ? rawAssets.filter((f): f is File => f instanceof File) : rawAssets instanceof File ? [rawAssets] : [];
    if (assetsFiles.length === 0) return c.json({ message: "No assets uploaded"}, 400);

    const uploadResults = await Promise.all(assetsFiles.map(async (asset) => {

        const arrayBuffer = await asset.arrayBuffer();

        const webpBuffer = await sharp(arrayBuffer)
            .webp({ quality: 70 })
            .resize(800, null, { withoutEnlargement: true })
            .toBuffer();

        const assetHash = await sha256(webpBuffer);
        const assetName = `${asset.name.substring(0, asset.name.indexOf("."))}.webp`;
        const assetNameHash = await sha256(assetName);
        const assetPath = `assets/${assetNameHash}`;

        try {
            await s3.write(assetPath, webpBuffer, {
                type: "image/webp"
            });
        } catch(error) {
            console.error("error detected:", error);
            return c.json({ message: `Could not upload asset: ${assetName}`}, 400);
        }

        try {

            const [ entry ] = await database.insert(assets).values({
                user_id: user.id,
                organization_name: organization.name,
                name: assetName!,
                path: assetPath!,
                hash: assetHash!,
            }).returning();
            
            return { id: entry?.id, hash: assetHash };
        } catch(error) {
            console.error("error detected:", error);
            return c.json({ message: `Could not upload asset: ${assetName}`}, 400);
        }
    }));

    return c.json({ files: uploadResults });
});

assetsRouter.delete("/:id", async (c) => {

    const organization = c.get("organization")!;
    const id = c.req.param("id");

    const [ asset ] = await database.select().from(assets).where(eq(assets.id, id));
    if (!asset) return c.notFound();

    try {
        await s3.delete(asset.path);
    } catch(error) {
        console.error("error detected:", error);
        return c.json({ message: "Could not delete asset" }, 400);
    }

    try {
        await database.delete(assets).where(and(eq(assets.id, id), eq(assets.organization_name, organization.name)));
    } catch (error) {
        console.error("error detected:", error);
        return c.json({ message: "Could not delete asset"}, 400);
    }

    return c.json({ message: `Deleted asset: ${asset.name}`});

});