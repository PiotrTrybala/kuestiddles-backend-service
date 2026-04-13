import { s3 } from "@/config/s3";
import { database } from "@/database/db";
import { avatars } from "@/database/schema/avatars";
import { DEFAULT_UPLOAD_HEIGHT, DEFAULT_UPLOAD_WEBP_QUALITY, DEFAULT_UPLOAD_WIDTH } from "@/database/schema/utils";
import type { S3File } from "bun";
import { eq } from "drizzle-orm";
import { sha256 } from "hono/utils/crypto";
import sharp from "sharp";

export type AvatarError = {
    code: number,
    error: string,
}

export async function getUserAvatar(userId: string): Promise<{ avatar?: S3File, error?: AvatarError }> {

    try {

        const metadata = await database.query.avatars.findFirst({
            where: eq(avatars.user_id, userId)
        });

        if (!metadata) {
            return {
                avatar: undefined,
                error: {
                    code: 404,
                    error: "Upload was not found"
                }
            }
        }

        const file = s3.file(metadata!.path);
        return { avatar: file }
    } catch (error) {
        console.error(`error detected:`, error);
        return {
            avatar: undefined,
            error: {
                code: 500,
                error: "Internal server error",
            }
        }
    }
}

export async function uploadAvatar(userId: string, avatar: File): Promise<{ hash?: string, error?: AvatarError }> {

    try {

        const buffer = await avatar.arrayBuffer();

        const webpBuffer = await sharp(Buffer.from(buffer))
            .webp({ quality: DEFAULT_UPLOAD_WEBP_QUALITY })
            .resize(128, 128, { withoutEnlargement: true, withoutReduction: true })
            .toBuffer(); // TODO: Add const. to it


        const uploadId = crypto.randomUUID() as string;
        const fileName = `${userId}.webp`;
        const uploadPath = `avatars/${fileName}`;
        const uploadHash = await sha256(webpBuffer);

        const [metadata] = await database.insert(avatars)
            .values({
                user_id: userId,
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
            hash: uploadHash!,
        };

    } catch (error) {
        console.error('error detected:', error);

        return {
            hash: undefined,
            error: {
                code: 500,
                error: "Internal server error",
            }
        }
    }
}