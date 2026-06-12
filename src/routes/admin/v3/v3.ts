
import type { Context } from "hono";
import type { ZodSafeParseResult } from "zod";

export function handleValidationError<T>(
    result: { success: true; data: T } | { success: false; error: { message: string }; data: T },
    c: Context
) {
    if (!result.success) {
        const error = JSON.parse(result.error.message);
        return c.json({
            success: false,
            message: error[0].message,
        }, 400);
    }
}