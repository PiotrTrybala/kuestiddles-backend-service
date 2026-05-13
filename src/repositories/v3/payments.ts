import { database } from "@/database/db";
import { user_quotas } from "@/database/payments";
import { eq, sql } from "drizzle-orm";

export async function getUserQuotas(userId: string) {
    try {

        const [quotas] = await database.select()
            .from(user_quotas)
            .where(eq(user_quotas.user_id, userId));
        
        if (!quotas) {
            return {
                quotas: undefined,
                error: "Quotas has not been found",
            }
        }

        return {
            quotas: quotas,
            error: undefined,
        }
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            results: [],
            error: "An unexpected database error occured",
        }
    }
}

export type QuotaType = 'landmarks' | 'quests' | 'games' | 'uploads' | 'organizations';

const quotaColumnMap: Record<QuotaType, keyof typeof user_quotas> = {
    landmarks: "landmarks_quota",
    quests: "quests_quota",
    games: "games_quota",
    uploads: "uploads_quota",
    organizations: "organization_quota",
} as const;

export async function increaseUsagePoint(userId: string, type: QuotaType) {
    try {
        const column = quotaColumnMap[type];

        const [result] = await database.update(user_quotas)
            .set({ [column]: sql`${user_quotas[column]} + 1`})
            .where(eq(user_quotas.user_id, userId))
            .returning();

        return { result };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            results: [],
            error: "An unexpected database error occured",
        }
    }
}

export async function removeUsagePoint(userId: string, type: QuotaType) {
    try {
        const column = quotaColumnMap[type];

        const [result] = await database.update(user_quotas)
            .set({ [column]: sql`GREATEST(${user_quotas[column]} - 1, 0)` })
            .where(eq(user_quotas.user_id, userId))
            .returning();

        return { result };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            result: undefined,
            error: "An unexpected database error occured",
        };
    }
}