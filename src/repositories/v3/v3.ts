// import type { ContentfulStatusCode, ContentlessStatusCode } from "hono/utils/http-status";
// import { DatabaseError } from "pg";

// export type RepositoryError = { message: string, status: ContentfulStatusCode | ContentlessStatusCode };

// function isRepositoryError(error: unknown): error is RepositoryError {
//     return typeof error === "object" && error !== null && "message" in error && "status" in error;
// }

// function isPostgresError(error: unknown): error is { code: string; message: string; constraint?: string } {
//     return (
//         typeof error === "object" &&
//         error !== null &&
//         ("code" in error && typeof (error as any).code === "string")
//     );
// }

// export function formatError(error: unknown): RepositoryError {

//     console.log('error to format', typeof error, error instanceof DatabaseError);

//     if (error instanceof DatabaseError || isPostgresError(error)) {
//         switch (error.code) {
//             case "23505":
//                 return { message: "A record with this value already exists", status: 409 };
//             case "23503":
//                 return { message: "Referenced record does not exist", status: 404 };
//             case "23502":
//                 return { message: "Required field is missing", status: 400 };
//             case "23514":
//                 return { message: "Value violates a check constraint", status: 400 };
//             case "22P02":
//                 return { message: "Invalid input format", status: 400 };
//             case "42P01":
//                 return { message: "Table does not exist", status: 500 };
//             case "42703":
//                 return { message: "Column does not exist", status: 500 };
//             case "08006":
//             case "08001":
//                 return { message: "Database connection failed", status: 503 };
//             default:
//                 return { message: "An unexpected database error has occurred", status: 500 };
//         }
//     }

//     if (isRepositoryError(error)) {
//         return error;
//     }

//     if (error instanceof Error) {
//         return { message: error.message, status: 500 };
//     }

//     return { message: "An unexpected error has occurred", status: 500 };
// }

import type { ContentfulStatusCode, ContentlessStatusCode } from "hono/utils/http-status";

export type RepositoryError = { 
    message: string; 
    status: ContentfulStatusCode | ContentlessStatusCode; 
};

// 1. Clear, maintainable lookup map for Postgres error codes
const POSTGRES_ERROR_MAP: Record<string, Omit<RepositoryError, 'message'> & { message: string | ((err: any) => string) }> = {
    "23505": { status: 409, message: "A record with this value already exists" },
    "23503": { status: 404, message: "Referenced record does not exist" },
    "23502": { status: 400, message: "Required field is missing" },
    "23514": { status: 400, message: "Value violates a check constraint" },
    "22P02": { status: 400, message: "Invalid input format" },
    "42P01": { status: 500, message: "Table does not exist" },
    "42703": { status: 500, message: "Column does not exist" },
    "08001": { status: 503, message: "Database connection failed" },
    "08006": { status: 503, message: "Database connection failed" },
};

// 2. Safe type guards
function isRepositoryError(error: unknown): error is RepositoryError {
    return typeof error === "object" && error !== null && "message" in error && "status" in error;
}

function hasPostgresCode(error: unknown): error is { code: string } {
    return typeof error === "object" && error !== null && "cause" in error && typeof (error as any).cause.code === "string";
}

// 3. Clean operational function
export function formatError(error: unknown): RepositoryError {
    // Log with a standard error logger or console.error for better visibility in logs
    console.error("Formatting error context:", error, (error as any).code);

    // Check if it has a Postgres error code (handles wrapped/driver mismatch errors seamlessly)

    if (hasPostgresCode(error)) {
        const mapped = POSTGRES_ERROR_MAP[error!.cause.code];
        if (mapped) {
            return {
                status: mapped.status,
                message: typeof mapped.message === "function" ? mapped.message(error) : mapped.message
            };
        }
        return { message: "An unexpected database error has occurred", status: 500 };
    }

    if (isRepositoryError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return { message: error.message, status: 500 };
    }

    return { message: "An unexpected error has occurred", status: 500 };
}