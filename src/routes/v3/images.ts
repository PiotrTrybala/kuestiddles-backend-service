import type { AppEnv } from "@/config/app";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { handleValidationError } from "../admin/v3/v3";
import { getAvatar } from "@/repositories/v3/avatars";
import { getImage } from "@/repositories/v3/images";
import type { ContentfulStatusCode } from "hono/utils/http-status";


export const imagesRouter = new Hono<AppEnv>();

imagesRouter.get("/:imageId", zValidator("param", z.object({
    imageId: z.uuid(),
}), handleValidationError), async (c) => {

    const { imageId } = c.req.valid("param");

    const { image, error } = await getImage(imageId);
    if (error) {
        return c.json({
            message: error.message,
        }, error.status as ContentfulStatusCode);
    }

    return c.body(image!.stream(), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
        }
    });
});