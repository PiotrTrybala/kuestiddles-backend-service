import { and, eq } from "drizzle-orm";
import { database } from "../database/db";
import { uploads } from "../database/schema/uploads";
import { DEFAULT_UPLOAD_HEIGHT, DEFAULT_UPLOAD_WIDTH, DEFAULT_UPLOAD_WEBP_QUALITY, getPageBounds, getUploadListConditions } from "../database/schema/utils";
import { s3 } from "../config/s3";
import type { S3File } from "bun";
import sharp from "sharp";
import { sha256 } from "hono/utils/crypto";


export type UploadError = {
    code: number,
    error: string,
}

export type ListUploadsParams = {
    page: number,
    pageSize: number,
    name: string,
    labels: string[],
};

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferSelect;

export async function listUploads(organizationId: string, params: ListUploadsParams): Promise<{ uploads: Upload[], error?: UploadError }> {

    try {

        const { page, pageSize, name, labels } = params;
        const { offset, limit } = getPageBounds(page, pageSize);
        const listConditions = getUploadListConditions(organizationId, name, labels);

        let listResults = await database.select()
            .from(uploads)
            .where(listConditions.length > 0 ? and(...listConditions) : undefined)
            .limit(limit)
            .offset(offset);

        return {
            uploads: listResults,
        }
    } catch (error) {
        console.error(`error detected:`, error);
        return {
            uploads: [],
            error: {
                code: 500,
                error: "Internal server error",
            }
        }
    }

}

export async function getUploadMetadata(id: string): Promise<{ metadata?: Upload, error?: UploadError }> {
    try {

        const metadata = await database.query.uploads.findFirst({
            where: eq(uploads.id, id)
        });

        if (!metadata) {
            return {
                metadata: undefined,
                error: {
                    code: 404,
                    error: "Upload was not found"
                }
            }
        }

        return {
            metadata,
        }
    } catch (error) {
        console.error(`error detected:`, error);
        return {
            metadata: undefined,
            error: {
                code: 500,
                error: "Internal server error",
            }
        }
    }
}

export async function getUploadFile(id: string): Promise<{ upload?: S3File, error?: UploadError }> {
    try {

        const { metadata, error } = await getUploadMetadata(id);
        if (error) {
            return {
                upload: undefined,
                error,
            }
        }

        const file = s3.file(metadata!.path);
        return { upload: file }
    } catch (error) {
        console.error(`error detected:`, error);
        return {
            upload: undefined,
            error: {
                code: 500,
                error: "Internal server error",
            }
        }
    }
}

// TODO: In the future, add more upload typess
export async function uploadFiles(
    organizationId: string,
    memberId: string,
    files: File[],
): Promise<{ results?: { id: string, hash: string }[], error?: UploadError }> {

    try {

        const results = await Promise.all(files.map(async (file) => {

            const buffer = await file.arrayBuffer();

            const webpBuffer = await sharp(Buffer.from(buffer))
                .webp({ quality: DEFAULT_UPLOAD_WEBP_QUALITY })
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
                    organization_id: organizationId,
                    member_id: memberId,
                    name: fileName,
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

    } catch (error) {
        console.error('error detected:', error);

        return {
            results: [],
            error: {
                code: 500,
                error: "Internal server error",
            }
        }
    }

}

export async function deleteUpload(id: string): Promise<{ error?: UploadError }> {
    try {
        const { metadata, error } = await getUploadMetadata(id);

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

    } catch(error) {
        return {
            error: {
                code: 500,
                error: "Internal server error",
            }
        }
    }
}