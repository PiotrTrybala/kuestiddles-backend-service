import { and, arrayOverlaps, DrizzleError, eq, ilike } from "drizzle-orm";
import { uploads } from "../database/schema/uploads";
import { database } from "../database/db";
import sharp from "sharp";
import { sha256 } from "hono/utils/crypto";
import { s3 } from "../config/s3";
import type { S3File } from "bun";

export type Error = {
    code: number;
    error: string;
};

export type Asset = typeof uploads.$inferSelect;

export type ListAssetsParams = {
    page: number,
    pageSize: number,
    name: string,
    labels: string[],
};

export async function listAssets(organizationSlug: string, organizationId: string, { page, pageSize, name, labels }: ListAssetsParams): Promise<{ assets: Asset[], error?: Error }> {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

        const conditions = [
            eq(uploads.organization_id, organizationId),
        ];

        if (name && name.trim() !== "") {
            conditions.push(ilike(uploads.name, `%${name}%`));
        }

        if (labels.length > 0) {
            conditions.push(arrayOverlaps(uploads.labels, labels));
        }

        const assets = await database.select()
            .from(uploads)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .offset(offset)
            .limit(limit);

        const fullAssets = assets.map((asset) => {
            const url = `${process.env.API_URL!}/admin/organizations/${organizationSlug}/assets/${asset.id}`;
            return {
                ...asset,
                url,
            };
        });

        return { assets: fullAssets };
    } catch (error) {
        console.log(`error detected:`, error);
        return { assets: [], error: { code: 500, error: "Internal error" } };
    }
}

export async function getAsset(id: string): Promise<{ asset?: Asset, file?: S3File, error?: Error }> {
    try {
        const asset = await database.query.uploads.findFirst({
            where: eq(uploads.id, id)
        });

        if (!asset) {
            return { error: { code: 404, error: "Asset not found" } };
        }

        const file = s3.file(asset!.path);

        return { asset, file };
    } catch (error) {
        console.log('error detected:', error);
        return { error: { code: 500, error: "Internal error while retrieving asset" } };
    }
}

export async function uploadAssets(
    organizationId: string,
    memberId: string,
    assets: File[]
): Promise<{ results?: { id: string, hash: string }[], error?: Error }> {

    try {
        const uploadsResults = await Promise.all(assets.map(async (asset) => {
            const buffer = await asset.arrayBuffer();

            const webpBuffer = await sharp(Buffer.from(buffer))
                .webp({ quality: 75 })
                .resize(400, 300, { withoutEnlargement: true })
                .toBuffer();

            const assetHash = await sha256(webpBuffer);
            const fileName = asset.name.split('.')[0];
            const assetName = `${fileName}.webp`;
            const hashedOrganizationId = await sha256(organizationId);
            const assetPath = `assets/${hashedOrganizationId}/${assetName}`;

            await s3.write(assetPath, webpBuffer, {
                type: "image/webp",
            });

            const [metadata] = await database.insert(uploads).values({
                organization_id: organizationId,
                member_id: memberId,
                name: assetName,
                path: assetPath!,
                hash: assetHash!,
            }).returning();

            if (!metadata) throw new Error(`DATABASE_FAILED: ${assetName}`);

            return { id: metadata.id, hash: metadata.hash };
        }));

        return { results: uploadsResults };

    } catch (error) {
        console.error('Upload process failed:', error);

        return {
            error: { 
                code: 500, 
                error: "Internal error while trying to upload assets", 
            }
        };
    }
}

export async function deleteAsset(organizationId: string, assetId: string): Promise<{ error?: Error }> {
    try {
        const asset = await database.query.uploads.findFirst({
            where: and(eq(uploads.id, assetId), eq(uploads.organization_id, organizationId))
        });

        if (!asset) return { error: { code: 404, error: "Asset not found" } };

        try {
            await s3.delete(asset.path);
            await database.delete(uploads).where(eq(uploads.id, assetId));
        } catch (error) {
            console.log('error detected:', error);
            return { error: { code: 500, error: `Could not delete asset: ${asset.name}` } };
        }  

        return {};
    } catch (error) {
        console.log('error detected:', error);
        return { error: { code: 500, error: "Internal error while deleting asset" } };
    }
}