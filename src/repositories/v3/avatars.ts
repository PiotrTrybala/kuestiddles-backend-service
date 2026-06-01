import { s3 } from "@/config/s3";
import { database } from "@/database/db";
import { avatars } from "@/database/schema";
import { eq } from "drizzle-orm";
import { sha256 } from "hono/utils/crypto";
import sharp from "sharp";

export async function getAvatar(userId: string): Promise<{ avatar?: Bun.S3File, error?: string }> {
    try {
        const [metadata] = await database.select()
            .from(avatars)
            .where(eq(avatars.user_id, userId));

        console.log(metadata);

        if (!metadata) {
            return {
                avatar: undefined,
                error: "avatar has not been found",
            }
        }

        const file = s3.file(metadata!.path);
        return { avatar: file }
    } catch (error) {
        console.error("Error occured while retriving users avatar:", error);

        return {
            avatar: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export const DEFAULT_AVATAR_QUALITY = 75;
export const DEFAULT_AVATAR_WIDTH = 128;
export const DEFAULT_AVATAR_HEIGHT = 128;

export async function uploadAvatar(
    userId: string,
    avatar: File,
): Promise<{ uploaded: boolean, error?: string }> {
    try {

        const buffer = await avatar.arrayBuffer();

        const webpBuffer = await sharp(Buffer.from(buffer))
            .webp({ quality: DEFAULT_AVATAR_QUALITY })
            .resize(DEFAULT_AVATAR_WIDTH, DEFAULT_AVATAR_HEIGHT, { withoutEnlargement: true, withoutReduction: true })
            .toBuffer();

        const avatarId = await sha256(userId);

        const uploadPath = `avatars/${avatarId!}`;

        await s3.write(uploadPath, webpBuffer, {
            type: "image/webp",
        });

        const [metadata] = await database.insert(avatars)
            .values({
                user_id: userId,
                path: uploadPath,
            }).returning();

        if (!metadata) {
            throw new Error("Avatar has not been updated");
        }
        return {
            uploaded: true,
        }
    } catch (error) {
        console.error("Error occured while uploading new users avatar:", error);

        return {
            uploaded: false,
            error: "An unexpected database error has occured",
        }
    }
}