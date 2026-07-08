import { database } from "@/database/db";
import { images } from "@/database/v3/uploads";
import { eq, ilike, arrayOverlaps, and } from "drizzle-orm";
import { formatError, type RepositoryError } from "./v3";
import { s3 } from "@/config/s3";
import sharp from "sharp";
import slugify from "slugify";
import { sha256 } from "hono/utils/crypto";

export type Image = {
    id: string,
    organizationId: string,
    slug: string,
    labels: string[],
    hash: string,
    createdAt: Date,
    updatedAt: Date,
};

export type Metadata = typeof images.$inferSelect;

export async function searchImages(organizationId: string, page: number, pageSize: number, slug?: string, labels?: string[]): Promise<{ images: Image[], error?: RepositoryError }> {
    try {
        const pageIndex = Math.max(1, page) - 1;
        const limit = Math.max(1, pageSize);

        const offset = pageIndex * page;

        const filters = [
            eq(images.organization_id, organizationId),
        ];

        if (slug && slug.length > 0) {
            filters.push(ilike(images.slug, `%${slug}%`));
        }

        if (labels && labels.length > 0) {
            filters.push(arrayOverlaps(images.labels, labels));
        }

        let searchResults = (await database.select().from(images)
            .where(and(...filters)).limit(limit).offset(offset)).map((metadata) => {
                return {
                    id: metadata.id,
                    organizationId: metadata.organization_id,
                    slug: metadata.slug,
                    labels: metadata.labels,
                    hash: metadata.hash,
                    createdAt: metadata.createdAt,
                    updatedAt: metadata.updatedAt,
                };
            });

        return {
            images: searchResults,
        };

    } catch (error) {
        console.error("Error occured while retriving uploads:", error);
        return {
            images: [],
            error: formatError(error),
        }
    }

}

export async function getImageMetadata(id: string): Promise<{ metadata?: Metadata, error?: RepositoryError }> {
    try {
        const [metadata] = await database.select()
            .from(images)
            .where(eq(images.id, id));

        if (!metadata) {
            return {
                metadata: undefined,
                error: { message: "Upload metadata was not found", status: 404 }
            }
        }

        return {
            metadata: metadata,
        }

    } catch (error) {
        console.error("Error occured while retriving upload metadata:", error);

        return {
            metadata: undefined,
            error: formatError(error),
        }
    }
}

export async function getImage(id: string): Promise<{ image?: Bun.S3File, error?: RepositoryError }> {
    try {

        const { metadata, error } = await getImageMetadata(id);
        if (error) {
            return {
                image: undefined,
                error,
            }
        }

        const image = s3.file(metadata!.path);
        return { image };
    } catch (error) {
        console.error("Error occured while retriving upload data:", error);

        return {
            image: undefined,
            error: formatError(error),
        }
    }
}

export async function uploadImages(organizationId: string, files: File[], options?: { quality?: number, width?: number, height?: number }): Promise<{ images: { id: string, slug: string, hash: string }[], error?: RepositoryError }> {
    try {
        const results = await Promise.all(files.map(async (image) => {

            const buffer = await image.arrayBuffer();

            const webpBuffer = await sharp(Buffer.from(buffer))
                .webp({ quality: options?.quality ?? 75 })
                .resize(options?.width ?? 400, options?.height ?? 300, { withoutEnlargement: false, withoutReduction: false })
                .toBuffer();

            const imageId = crypto.randomUUID() as string;
            const fileName = image.name.split(".")[0] ?? imageId;
            const slug = slugify(fileName, { remove: /_@#\$\^/, lower: true, trim: true });
            const path = `images/${organizationId}/${imageId}.webp`;
            const hash = (await sha256(webpBuffer))!;

            await s3.write(path, webpBuffer, {
                type: "image/webp"
            });

            const [metadata] = await database.insert(images)
                .values({
                    id: imageId,
                    slug: slug,
                    organization_id: organizationId,
                    labels: [],
                    path: path,
                    hash: hash,
                }).returning();

            if (!metadata) {
                throw new Error(`An unexpected occured while uploading new images: ${image.name}`)
            }

            return {
                id: metadata.id,
                slug: metadata.slug,
                hash: metadata.hash,
            }
        }));

        return {
            images: results,
        }
    } catch (error) {
        console.error("Error occured while uploading new uploads:", error);

        return {
            images: [],
            error: formatError(error),
        }
    }
}

export async function deleteImageById(id: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
    try {
        const { metadata, error } = await getImageMetadata(id);

        if (error || !metadata) {
            return {
                deleted: false,
                error: formatError(error),
            };
        }

        await database.delete(images).where(eq(images.id, id));
        await s3.delete(metadata.path);

        return {
            deleted: true,
        }
    } catch (error) {
        console.error("Internal system error during upload deletion:", error);

        return {
            deleted: false,
            error: formatError(error),
        };
    }
}