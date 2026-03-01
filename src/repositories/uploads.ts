import { and, arrayOverlaps, eq, ilike } from "drizzle-orm";
import { organization } from "../database/schema/auth";
import { uploads } from "../database/schema/uploads";
import { database } from "../database/db";
import { s3 } from "../config/s3";
import sharp from "sharp";
import { sha256 } from "hono/utils/crypto";

export type ListAssetsParams = {
    page: number,
    pageSize: number,
    labels: string[],
    name: string,
};

export async function listAssets(organizationId: string, { page, pageSize, labels, name }: ListAssetsParams) {

    const offset = page * pageSize;
    const limit = pageSize;

    const conditions = [
        eq(organization.id, organizationId),
        ilike(uploads.name, `%${name}%`),
    ];

    if (labels.length > 0) conditions.push(arrayOverlaps(uploads.labels, ['profile', ...labels]));

    const result = await database.select()
        .from(uploads)
        .where(conditions.length ? and(...conditions) : undefined)
        .offset(offset)
        .limit(limit);

    const fullUploads = result.map((upload) => {
        const url = `${process.env.ASSETS_URL!}/${upload.id}`;
        return {
            ...upload,
            url,
        };
    });

    return {
        page,
        uploads: fullUploads,
    };
};

export async function getAsset(id: string) {
    const upload = await database.query.uploads.findFirst({
        where: and(
            eq(uploads.id, id),
            arrayOverlaps(uploads.labels, ['asset'])
        )
    });

    if (!upload) return undefined;

    const asset = s3.file(upload!.path);
    const buffer = await asset.arrayBuffer();

    return {
        metadata: upload,
        asset: buffer,
    }
}

export async function uploadAssets(organizationId: string, memberId: string, files: File[]) {

    const uploadResults = await Promise.all(files.map(async (file) => {

        const buffer = await file.arrayBuffer();

        const webp = await sharp(buffer)
            .webp({ quality: 75 })
            .resize(400, 300, { withoutEnlargement: true, withoutReduction: true })
            .toBuffer();

        const assetHash = await sha256(webp);
        const assetName = `${file.name.substring(0, file.name.indexOf('.'))}.webp`;

        const hashedUserId = await sha256(organizationId);
        const assetPath = `assets/${hashedUserId}/${assetName}`;

        try {
            await s3.write(assetPath, webp, {
                type: "image/webp",
            });
        } catch (error) {
            return undefined;
        }

        try {
            const [metadata] = await database.insert(uploads).values({
                member_id: memberId,
                organization_id: organizationId,
                name: assetName!,
                path: assetPath!,
                labels: ['asset'],
                hash: assetHash!,
            }).returning();

            return { id: metadata?.id, hash: metadata?.hash };

        } catch (error) {
            return undefined;
        }
    }));

    return {
        ...uploadResults
    };
};

export async function deleteAsset(id: string) {
    const [asset] = await database.select().from(uploads).where(eq(uploads.id, id));
    if (!asset) return undefined; // TODO: Implement better return error types

    try {
        await s3.delete(asset.path);
    } catch (error) {
        console.error("error detected:", error);
        return undefined;
    }

    try {
        await database.delete(uploads).where(and(eq(uploads.id, id), eq(uploads.organization_id, organization.slug)));
    } catch (error) {
        console.error("error detected:", error);
        return undefined;
    }

    return true; // TODO: Return better type than bool
}