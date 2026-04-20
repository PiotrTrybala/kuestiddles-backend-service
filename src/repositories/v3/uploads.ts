import { s3 } from "@/config/s3";
import { database } from "@/database/db";
import { uploads } from "@/database/v3/uploads";
import { and, arrayOverlaps, eq, ilike } from "drizzle-orm";
import { sha256 } from "hono/utils/crypto";
import sharp from "sharp";
import slugify from "slugify";
import { getUploadMetadata } from "../uploads";

export type UploadType = typeof uploads.$inferSelect;
export type UploadInsertType = typeof uploads.$inferInsert;

export async function search(organizationId: string, page: number, pageSize: number, name?: string, labels?: string[]) {
    try {

        const offset = page * pageSize;
        const limit = pageSize;


        const filters = [
            eq(uploads.organization_id, organizationId),
        ];

        if (name && name.length > 0) {
            filters.push(ilike(uploads.name, `%${name}%`));
        }

        if (labels && labels.length > 0) {
            filters.push(arrayOverlaps(uploads.labels, labels));
        }

        let searchResults = await database.select()
            .from(uploads)
            .where(and(...filters))
            .limit(limit)
            .offset(offset);

        return {
            results: searchResults,
        };

    } catch (error) {

        console.error("Internal database error:", error);


        return {
            results: [],
            error: "An unexpected database error occured",
        }
    }
}

export async function getMetadataById(id: string) {
    try {
        const metadata = await database.query.uploads.findFirst({
            where: eq(uploads.id, id)
        });

        if (!metadata) {
            return {
                metadata: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            metadata: metadata,
        }

    } catch (error) {
        console.error("Internal database error:", error);

        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }

}

export async function getDataById(id: string) {
    try {
        const { metadata, error } = await getMetadataById(id);
        if (error) {
            return {
                file: undefined,
                error,
            }
        }

        const file = s3.file(metadata!.path);
        return { file }
    } catch (error) {
        console.error("Internal database error:", error);

        return {
            results: [],
            error: "An unexpected database error occured",
        }
    }
}

export async function getMetadataBySlug(organizationId: string, slug: string) {
    try {
        const metadata = await database.query.uploads.findFirst({
            where: and(eq(uploads.organization_id, organizationId), eq(uploads.slug, slug))
        });

        if (!metadata) {
            return {
                metadata: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            metadata: metadata,
        }

    } catch (error) {
        console.error("Internal database error:", error);

        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export const DEFAULT_UPLOAD_QUALITY = 75;
export const DEFAULT_UPLOAD_WIDTH = 400;
export const DEFAULT_UPLOAD_HEIGHT = 300;

export async function upload(organizationId: string, files: File[]) {
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
                throw new Error(`Could not upload new file`);
            }

            await s3.write(uploadPath, webpBuffer, {
                type: "image/webp",
            });

            return {
                id: metadata.id,
                hash: metadata.hash,
            };
        }));

        return {
            results,
        };
    } catch (error: any) {
        console.error("Internal database error:", error);

        return {
            results: [],
            error: "An unexpected database error occured",
        }
    }
}

export async function removeById(id: string) {
    try {
        const { metadata, error } = await getMetadataById(id);

        if (error || !metadata) {
            return {
                error: {
                    code: 404,
                    error: "Upload was not found",
                }
            }
        }

        await s3.delete(metadata.path);
        await database.transaction(async (tx) => {
            await tx.delete(uploads)
                .where(eq(uploads.id, id));
        });

        return {}
    } catch (error) {
        console.error("Internal database error:", error);


        return {
            results: [],
            error: "An unexpected database error occured",
        }
    }
}

export async function removeBySlug(organizationId: string, slug: string) {
    try {
const { metadata, error } = await getMetadataBySlug(organizationId, slug);

        if (error || !metadata) {
            return {
                error: {
                    code: 404,
                    error: "Upload was not found",
                }
            }
        }

        await s3.delete(metadata.path);
        await database.transaction(async (tx) => {
            await tx.delete(uploads)
            .where(and(eq(uploads.organization_id, organizationId), eq(uploads.slug, slug)));
        });

        return {}

    } catch (error) {
        console.error("Internal database error:", error);

        return {
            error: "An unexpected database error occured",
        }
    }
}