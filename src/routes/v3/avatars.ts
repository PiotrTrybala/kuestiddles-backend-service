import type { AppEnv } from "@/config/app";
import { getAvatar, uploadAvatar } from "@/repositories/v3/avatars";
import { Hono } from "hono";
import { uploadSchema } from "../validators";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

export const avatarsRouter = new Hono<AppEnv>();

avatarsRouter.get("/:userId", zValidator('param', z.object({
    userId: z.string().transform((value) => value.replace(".webp", "")),
})), async (c) => {
    const { userId } = c.req.valid("param");

    const { file, error } = await getAvatar(userId);
    if (error) {
        return c.notFound(); // TODO: Add different error response
    }

    return c.body(file!.stream(), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
        }
    });
});

avatarsRouter.post("/", zValidator("form", uploadSchema), async (c) => {

    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);

    const avatar = c.req.valid("form");

    const { error } = await uploadAvatar(user.id, avatar);
    if (error) {
        return c.notFound(); // TODO: Add different error response
    }

    return c.body(null, 200);
});