import { s3 } from "@/config/s3";
import { database } from "@/database/db";
import { uploads } from "@/database/v3/uploads";
import { and, arrayOverlaps, eq, ilike } from "drizzle-orm";
import { sha256 } from "hono/utils/crypto";
import sharp, { format } from "sharp";
import slugify from "slugify";
import { formatError, type RepositoryError } from "./repositories";

type Upload = typeof uploads.$inferSelect;

export async function searchUploads(organizationId: string, page: number, pageSize: number, name?: string, labels?: string[]): Promise<{ uploads: Upload[], error?: RepositoryError }> {
    try {
        const pageIndex = Math.max(1, page) - 1; 
        const limit = Math.max(1, pageSize);
        
        const offset = pageIndex * limit;

        console.info(pageIndex, limit, offset);

        const filters = [
            eq(uploads.organization_id, organizationId),
        ];

        if (name && name.length > 0) {
            filters.push(ilike(uploads.name, `%${name}%`));
        }

        console.log(labels);

        if (labels && labels.length > 0) {
            filters.push(arrayOverlaps(uploads.labels, labels));
        }

        let searchResults = await database.select().from(uploads)
            .where(and(...filters));

        return {
            uploads: searchResults,
        };

    } catch (error) {
        console.error("Error occured while retriving uploads:", error);
        return {
            uploads: [],
            error: formatError(error),
        }
    }
}

export async function getUploadMetadataById(id: string): Promise<{ metadata?: Upload, error?: RepositoryError }> {
    try {
        const [ metadata ] = await database.select()
            .from(uploads)
            .where(eq(uploads.id, id));

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

export async function getUploadDataById(id: string): Promise<{ data?: Bun.S3File, error?: RepositoryError }> {
    try {
        const { metadata, error } = await getUploadMetadataById(id);
        if (error) {
            return {
                data: undefined,
                error: formatError(error),
            }
        }

        const file = s3.file(metadata!.path);
        return { data: file, }
    } catch (error) {
        console.error("Error occured while retriving upload data:", error);

        return {
            data: undefined,
            error: formatError(error),
        }
    }
}

export async function getUploadMetadataBySlug(organizationId: string, slug: string): Promise<{ metadata?: Upload, error?: RepositoryError }> {
    try {
        const [ metadata ] = await database.select()
            .from(uploads)
            .where(and(eq(uploads.organization_id, organizationId), eq(uploads.slug, slug)));

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
        console.error("Error occured while retriving upload metadata by slug:", error);

        return {
            metadata: undefined,
            error: formatError(error),
        }
    }
}

export const DEFAULT_UPLOAD_QUALITY = 75;
export const DEFAULT_UPLOAD_WIDTH = 400;
export const DEFAULT_UPLOAD_HEIGHT = 300;

export async function uploadUploads(organizationId: string, files: File[]): Promise<{ uploads: { id: string, hash: string }[], error?: RepositoryError }> {
    try {
        const results = await Promise.all(files.map(async (file) => {

            const buffer = await file.arrayBuffer();

            const webpBuffer = await sharp(Buffer.from(buffer))
                .webp({ quality: DEFAULT_UPLOAD_QUALITY })
                .resize(DEFAULT_UPLOAD_WIDTH, DEFAULT_UPLOAD_HEIGHT, { withoutEnlargement: true, withoutReduction: true })
                .toBuffer();


            const uploadId = crypto.randomUUID() as string;
            const fileName = file.name.split('.')[0] ?? uploadId;
            const organizationHash = await sha256(organizationId);
            const uploadPath = `assets/${organizationHash}/${uploadId}.webp`;
            const uploadHash = await sha256(webpBuffer);

            await s3.write(uploadPath, webpBuffer, {
                type: "image/webp",
            });

            const [metadata] = await database.insert(uploads)
                .values({
                    id: uploadId,
                    slug: slugify(fileName, {
                        lower: true,
                        trim: true,
                    }),
                    organization_id: organizationId,
                    name: fileName,
                    labels: [],
                    path: uploadPath,
                    hash: uploadHash!,
                })
                .returning();

            if (!metadata) {
                throw new Error(`Error occured while uploading new file: ${file.name}`);
            }

            return {
                id: metadata.id,
                hash: metadata.hash,
            };
        }));

        return {
            uploads: results,
        };
    } catch (error: any) {
        console.error("Error occured while uploading new uploads:", error);

        return {
            uploads: [],
            error: formatError(error),
        }
    }
}

export async function removeUploadById(id: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
    try {
        const { metadata, error } = await getUploadMetadataById(id);

        if (error || !metadata) {
            return {
                deleted: false,
                error: formatError(error),
            };
        }

        await database.delete(uploads).where(eq(uploads.id, id));
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

export async function removeUploadBySlug(organizationId: string, slug: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
    try {
        const { metadata, error } = await getUploadMetadataBySlug(organizationId, slug);

        if (error || !metadata) {
            return {
                deleted: false,
                error: formatError(error),
            };
        }
        await database.delete(uploads).where(and(eq(uploads.organization_id, organizationId), eq(uploads.slug, slug)));
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