import { DrizzleError, DrizzleQueryError } from "drizzle-orm";
import type { ContentfulStatusCode, ContentlessStatusCode } from "hono/utils/http-status";

export type RepositoryError = { 
    message: string; 
    status: ContentfulStatusCode | ContentlessStatusCode; 
};

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

function isRepositoryError(error: unknown): error is RepositoryError {
    return typeof error === "object" && error !== null && "message" in error && "status" in error;
}

function hasPostgresCode(error: unknown): error is { code: string } {
    return typeof error === "object" && error !== null && "cause" in error && typeof (error as any).cause.code === "string";
}

export function formatError(error: unknown): RepositoryError {
    console.error("Formatting error context:", error, (error as any).cause.code);

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