
import type { Context } from "hono";

export function handleValidationError<T>(
    result: { success: true; data: T } | { success: false; error: { message: string }; data: T },
    c: Context
) {
    if (!result.success) {
        
        const error = JSON.parse(result.error.message)[0];
        return c.json({
            success: false,
            message: `Invalid ${error.path[0]} value`,
        }, 400);
    }
}