import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { deleteAsset, getAsset, listAssets, uploadAssets } from "../../repositories/assets";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { requireOrganization } from "./middleware";

export const assetsRouter = new Hono<AppEnv>();

assetsRouter.use("/*", requireOrganization);

assetsRouter.get("/list", async (c) => {

    const organization = c.get("organization")!;

    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);
    const labels = (c.req.query("labels") || "")
        .split(",")
        .map(l => l.trim())
        .filter(Boolean);

    const name = c.req.query("name")!;

    const { assets } = await listAssets(organization.id, { page, pageSize, name, labels });

    return c.json({ page, assets });


    // const offset = page * pageSize;
    // const limit = pageSize;

    // const conditions = [
    //     eq(uploads.organization_name, organization.name)
    // ];

    // if (name && name.trim() !== "") {
    //     conditions.push(ilike(uploads.name, `%${name}%`));
    // }

    // if (labels.length > 0) {
    //     conditions.push(arrayOverlaps(uploads.labels, labels));
    // }

    // const result = await database.select()
    //     .from(uploads)
    //     .where(conditions.length ? and(...conditions) : undefined)
    //     .offset(offset)
    //     .limit(limit);

    // const fulluploads = result.map((asset) => {
    //     const url = `${process.env.ASSETS_URL!}/${asset.id}`;
    //     return {
    //         ...asset,
    //         url,
    //     };
    // });

    // return c.json({
    //     page,
    //     uploads: fulluploads,
    // });
});

assetsRouter.get("/:id", async (c) => {

    const id = c.req.param("id");

    console.log(id);

    const { asset, file, error } = await getAsset(id);

    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }


    // const assetBuffer = await asset.arrayBuffer();

    // const [metadata] = await database.select()
    //     .from(uploads)
    //     .where(and(eq(uploads.id, id), arrayOverlaps(uploads.labels, ['asset'])));

    // if (!metadata) {
    //     return c.body(await defaultThumbnailFile.arrayBuffer(), 200, {
    //         'Content-Type': 'image/webp',
    //         'Cache-Control': 'public, max-age=31536000'
    //     });
    // }

    const buffer = await file?.arrayBuffer()!;

    return c.body(buffer, 200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000'
    });
});

assetsRouter.post("/", async (c) => {
    const organization = c.get("organization")!;
    const membership = c.get("membership")!;

    const body = await c.req.parseBody({ all: true });

    console.log('body:', body);

    const rawAssets = body['assets'];

    console.log('raw assets:', rawAssets);

    const assets: File[] = Array.isArray(rawAssets) ? rawAssets.filter((f): f is File => f instanceof File) : rawAssets instanceof File ? [rawAssets] : [];
    if (assets.length === 0) return c.json({ message: "No assets uploaded" }, 400);

    const { results, error } = await uploadAssets(organization.id, membership.id, assets);

    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.json(results);

    // const uploadResults = await Promise.all(assets.map(async (asset) => {

    //     const assetBuffer = await asset.arrayBuffer();

    //     const webpBuffer = await sharp(assetBuffer)
    //         .webp({ quality: 75 })
    //         .resize(400, 300, { withoutEnlargement: true, withoutReduction: true })
    //         .toBuffer();

    //     const assetHash = await sha256(webpBuffer);
    //     const assetName = `${asset.name.substring(0, asset.name.indexOf('.'))}.webp`;

    //     const hashedUserId = await sha256(user.id);
    //     const assetPath = `assets/${hashedUserId}/${assetName}`;

    //     try {
    //         await s3.write(assetPath, webpBuffer, {
    //             type: "image/webp",
    //         });
    //     } catch (error) {
    //         console.log(`error detected: ${error}`);
    //         return c.json({ message: `Could not upload asset: ${assetName}` }, 400);
    //     }

    //     try {
    //         const [metadata] = await database.insert(uploads).values({
    //             user_id: user.id,
    //             organization_name: organization.name,
    //             name: assetName!,
    //             path: assetPath!,
    //             labels: ['asset'],
    //             hash: assetHash!,
    //         }).returning();

    //         return { id: metadata?.id, hash: metadata?.hash };

    //     } catch (error) {
    //         console.error(`error detected: ${error}`);
    //         return c.json({ message: `Could not upload asset: ${assetName}` }, 400);
    //     }
    // }));

    // return c.json({ assets: uploadResults });
});

assetsRouter.delete("/:id", async (c) => {
    const organization = c.get("organization")!;
    const id = c.req.param("id");

    const { error } = await deleteAsset(organization.id, id);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.body(null, 200);

    // const [asset] = await database.select().from(uploads).where(eq(uploads.id, id));
    // if (!asset) return c.notFound();

    // try {
    //     await s3.delete(asset.path);
    // } catch (error) {
    //     console.error("error detected:", error);
    //     return c.json({ message: "Could not delete asset" }, 400);
    // }

    // try {
    //     await database.delete(uploads).where(and(eq(uploads.id, id), eq(uploads.organization_name, organization.name)));
    // } catch (error) {
    //     console.error("error detected:", error);
    //     return c.json({ message: "Could not delete asset" }, 400);
    // }

    // return c.json({ message: `Deleted asset: ${asset.name}` });
});