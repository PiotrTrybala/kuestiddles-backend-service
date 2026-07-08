import type { AppEnv } from "@/config/app";
import { addAvatar, getAvatar, uploadAvatar } from "@/repositories/v3/avatars";
import { Hono } from "hono";
import { avatarSchema } from "../validators";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { requireAuth } from "@/routes/middleware";
import { handleValidationError } from "../admin/v3/v3";

export const avatarsRouter = new Hono<AppEnv>();

avatarsRouter.get("/:userId", zValidator('param', z.object({
    userId: z.string().max(64, { error: "UserId is too long (max 64 characters)" }),
}), handleValidationError), async (c) => {
    const { userId } = c.req.valid("param");

    const { avatar, error } = await getAvatar(userId);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.body(avatar!.stream(), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
        }
    });
});

avatarsRouter.post("/", requireAuth("none"), zValidator("form", avatarSchema, handleValidationError), async (c) => {

    const user = c.get("user")!;
    const { avatar } = c.req.valid("form");

    const { added, error } = await addAvatar(user.id, avatar);

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({ added });
});