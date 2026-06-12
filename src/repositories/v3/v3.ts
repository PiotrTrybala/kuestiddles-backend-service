import type { ContentfulStatusCode, ContentlessStatusCode } from "hono/utils/http-status";
import { DatabaseError } from "pg";

export type RepositoryError = { message: string, status: ContentfulStatusCode | ContentlessStatusCode };

function isRepositoryError(error: unknown): error is RepositoryError {
    return typeof error === "object" && error !== null && "message" in error && "status" in error;
}

export function formatError(error: unknown): RepositoryError {
    if (error instanceof DatabaseError) {
        switch (error.code) {
            case "23505":
                return { message: "A record with this value already exists", status: 409 };
            case "23503":
                return { message: "Referenced record does not exist", status: 404 };
            case "23502":
                return { message: "Required field is missing", status: 400 };
            case "23514":
                return { message: "Value violates a check constraint", status: 400 };
            case "22P02":
                return { message: "Invalid input format", status: 400 };
            case "42P01":
                return { message: "Table does not exist", status: 500 };
            case "42703":
                return { message: "Column does not exist", status: 500 };
            case "08006":
            case "08001":
                return { message: "Database connection failed", status: 503 };
            default:
                return { message: "An unexpected database error has occurred", status: 500 };
        }
    }

    if (isRepositoryError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return { message: error.message, status: 500 };
    }

    return { message: "An unexpected error has occurred", status: 500 };
}