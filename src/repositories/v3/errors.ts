import type { ContentfulStatusCode, ContentlessStatusCode } from "hono/utils/http-status";

export type SystemError = {
    message: string,
    status: ContentfulStatusCode | ContentlessStatusCode,
};

const POSTGRES_ERROR_MAP: Record<string, SystemError> = {
    "23505": { status: 409, message: "Taki rejestr już istnieje" },
    "23503": { status: 404, message: "Taki rejestr nie istnieje" },
    "23502": { status: 400, message: "Brak wymaganego pola" },
    "23514": { status: 400, message: "Nieprawidłowe dane" },
    "22P02": { status: 400, message: "Zły format danych" },
    "08001": { status: 503, message: "Nie można połączyć się z bazą danych" },
    "08006": { status: 503, message: "Nie można połączyć się z bazą danych" },
};

export function isSystemError(error: any): error is SystemError {
    return typeof error === "object" && error !== null && "message" in error && "status" in error;
}

export function formatPostgresError(error: any) {

}

export function formatRedisError(error: any) {



}

export function fallbackError(error: any) {

}