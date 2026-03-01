import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { database } from "../../database/db";
import { uploads } from "../../database/schema/uploads";
import { and, eq } from "drizzle-orm";
import { defaultProfilePictureFile } from "../../public";
import { s3 } from "../../config/s3";
import sharp from "sharp";
import { sha256 } from "hono/utils/crypto";
import { user } from "../../database/schema/auth";

export const avatarsRouter = new Hono<AppEnv>();

avatarsRouter.get("/:id", async (c) => {

    const user = c.get("user")!;
    const id = c.req.param("id");

    const [metadata] = await database.select()
        .from(uploads)
        .where(and(eq(uploads.id, id), eq(uploads.labels, ['profile'])));

    if (!user.image) {
        return c.body(await defaultProfilePictureFile.arrayBuffer(), 200, {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000'
        });
    }

    // Assumption: Profile picture in S3 exists

    const profilePicture = s3.file(metadata!.path);
    const profileBuffer = await profilePicture.arrayBuffer();

    return c.body(profileBuffer, 200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
    });
});

avatarsRouter.post("/", async (c) => {

    const { id: userId } = c.get("user")!;
    const body = await c.req.parseBody({ all: true });
    const rawProfilePicture = body['profilePicture'];
    if (!(rawProfilePicture instanceof File)) return c.json({ message: "Profile picture must be a file" }, 400);

    let profilePicture: File = rawProfilePicture;

    if (profilePicture.size > 2 * 1024 * 1024) return c.json({ message: "Profile picture is too large" }, 400);

    const profileBuffer = await profilePicture.arrayBuffer();

    const webpBuffer = await sharp(profileBuffer)
        .webp({ quality: 50 })
        .resize(128, 128, { withoutEnlargement: true, withoutReduction: true })
        .toBuffer();

    const assetHash = await sha256(webpBuffer);
    const assetName = `${userId}.webp`;

    const hashedUserId = await sha256(userId);
    const assetPath = `avatars/${hashedUserId}.webp`;

    try {
        await s3.write(assetPath, webpBuffer, {
            type: "image/webp",
        });
    } catch (error) {
        console.log(`error detected: ${error}`);
        return c.json({ message: `Could not upload asset: ${assetName}` }, 400);
    }

    try {
        const [metadata] = await database.insert(uploads).values({
            user_id: null,
            organization_name: "kuestiddles",
            name: assetName!,
            path: assetPath!,
            labels: ['asset'],
            hash: assetHash!,
        }).returning();

        const avatarId = metadata?.id;

        const [updated] = await database.update(user).set({
            image: `http://localhost:3000/api/v1/avatars/${avatarId}`,
        }).returning();

    } catch (error) {
        console.error(`error detected: ${error}`);
        return c.json({ message: `Could not upload asset: ${assetName}` }, 400);
    }



});