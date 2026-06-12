import { database } from "@/database/db";
import { user_quotas } from "@/database/payments";
import { eq, sql } from "drizzle-orm";
import { formatError, type RepositoryError } from "./v3";

type UserQuotas = typeof user_quotas.$inferSelect;

export async function getUserQuotas(userId: string): Promise<{ quotas?: UserQuotas, error?: RepositoryError }> {
    try {

        const [quotas] = await database.select()
            .from(user_quotas)
            .where(eq(user_quotas.user_id, userId));
        
        if (!quotas) {
            return {
                quotas: undefined,
                error: { message: "Quotas has not been found", status: 404 } ,
            }
        }

        return {
            quotas: quotas,
        }
    } catch (error) {
        console.error("Error occured while retriving user quotas:", error);
        return {
            quotas: undefined,
            error: formatError(error),
        }
    }
}

export type QuotaType = 'landmarks' | 'quests' | 'games' | 'uploads' | 'organizations';

export const quotaColumnMap: Record<QuotaType, keyof typeof user_quotas> = {
    landmarks: "landmarks_quota",
    quests: "quests_quota",
    games: "games_quota",
    uploads: "uploads_quota",
    organizations: "organization_quota",
} as const;

export async function increaseUsagePoint(userId: string, type: QuotaType): Promise<{ updated?: UserQuotas, error?: RepositoryError }> {
    try {
        const column = quotaColumnMap[type];

        const [result] = await database.update(user_quotas)
            .set({ [column]: sql`${user_quotas[column]} + 1`})
            .where(eq(user_quotas.user_id, userId))
            .returning();

        return { updated: result };
    } catch (error) {
        console.error("Error occured while increasing user usage quota:", error);
        return {
            updated: undefined,
            error: formatError(error),
        }
    }
}

export async function removeUsagePoint(userId: string, type: QuotaType): Promise<{ updated?: UserQuotas, error?: RepositoryError }> {
    try {
        const column = quotaColumnMap[type];

        const [result] = await database.update(user_quotas)
            .set({ [column]: sql`GREATEST(${user_quotas[column]} - 1, 0)` })
            .where(eq(user_quotas.user_id, userId))
            .returning();

        return { updated: result };
    } catch (error) {
        console.error("Error occured while decreasing user usage quota:", error);
        return {
            updated: undefined,
            error: formatError(error),
        };
    }
}