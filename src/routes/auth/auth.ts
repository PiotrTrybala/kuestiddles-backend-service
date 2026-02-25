import { Hono } from "hono";
import { type AppEnv } from "../../config/app";
import sharp from "sharp";
import { s3 } from "../../config/s3";
import { database } from "../../database/db";
import { user } from "../../database/schema/auth";
import { eq } from "drizzle-orm";
import { defaultProfilePictureFile } from "../../static";

export const authRouter = new Hono<AppEnv>();

authRouter.get("/avatar/:id", async (c) => {

    const userId = c.req.param("id");

    const [result] = await database.select({ imageUrl: user.image }).from(user).where(eq(user.id, userId));

    if (result?.imageUrl == "") {
        return c.body(await defaultProfilePictureFile.arrayBuffer(), 200, {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000'
        });
    }

    const profilePicturePath = `avatars/${userId}.webp`;

    const picture = s3.file(profilePicturePath);
    if (!(await picture.exists())) {
        return c.notFound();
    }

    const data = await picture.arrayBuffer();

    return c.body(data, 200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000'
    });
});

authRouter.post("/avatar", async (c) => {

    const userId = c.get("user")!.id;
    const form = await c.req.parseBody({ all: true });
    const rawProfilePicture = form['profilePicture'];

    if (!(rawProfilePicture instanceof File)) return c.json({ message: "Profile picture must be file" }, 400);

    let profilePicture = rawProfilePicture as File;

    if (profilePicture.size > 2 * 1024 * 1024) {
        return c.json({ message: "Profile picture too large" }, 400);
    }

    const arrayBuffer = await profilePicture!.arrayBuffer();

    const webpBuffer = await sharp(arrayBuffer)
        .webp({ quality: 50 })
        .resize(256, 256, { withoutEnlargement: true, withoutReduction: true })
        .toBuffer();

    const profilePictureName = `${userId}.webp`;
    const profilePicturePath = `avatars/${profilePictureName}`
    const profilePictureURL = `${process.env.AVATARS_URL!}/${userId}`;
    // TODO: Add hash calculation later

    try {
        await s3.write(profilePicturePath, webpBuffer, {
            type: "image/webp"
        });
    } catch (error) {
        console.error("error detected:", error);
        return c.json({ message: `Could not upload profile picture: ${profilePictureName}` }, 400);
    }

    try {
        await database.update(user).set({
            image: profilePictureURL,
        });
    } catch (error) {
        console.error("error detected:", error);
        return c.json({ message: `Could not upload profile picture: ${profilePictureName}` }, 400);
    }

    return c.json({
        url: profilePictureURL,
    }, 200);
});