import { database } from "@/database/db";
import { competitions } from "@/database/schema";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";

type Competition = typeof competitions.$inferSelect;

export async function searchCompetitions(organizationId: string, page: number, pageSize: number, name?: string): Promise<{ competitions: Competition[], error?: string }> {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

        const filters = [
            eq(competitions.organization_id, organizationId),
        ];

        if (name && name.length > 0) {
            filters.push(ilike(competitions.slug, `%${name}%`));
        }

        const results = await database.select()
            .from(competitions)
            .where(and(...filters))
            .limit(limit)
            .offset(offset);

        return { competitions: results };
    } catch (error) {
        console.error("Error occured while retrieving competitions:", error);
        return {
            competitions: [],
            error: "An unexpected database error has occured",
        };
    }
}

export async function getCompetitionById(id: string): Promise<{ competition?: Competition, error?: string }> {
    try {
        const [competition] = await database.select()
            .from(competitions)
            .where(eq(competitions.id, id));

        if (!competition) {
            return {
                competition: undefined,
                error: "Competition has not been found",
            };
        }

        return { competition };
    } catch (error) {
        console.error("Error occured while retrieving competition:", error);
        return {
            competition: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function getCompetitionBySlug(organizationId: string, slug: string): Promise<{ competition?: Competition, error?: string }> {
    try {
        const [competition] = await database.select()
            .from(competitions)
            .where(and(eq(competitions.organization_id, organizationId), eq(competitions.slug, slug)));

        if (!competition) {
            return {
                competition: undefined,
                error: "Competition has not been found",
            };
        }

        return { competition };
    } catch (error) {
        console.error("Error occured while retrieving competition by slug:", error);
        return {
            competition: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function getLeaderboard(competitionId: string): Promise<{ leaderboard: Leaderboard[], error?: string }> {
    try {
        const entries = await database.select()
            .from(leaderboard)
            .where(eq(leaderboard.competition_id, competitionId))
            .orderBy(desc(leaderboard.points));

        return { leaderboard: entries };
    } catch (error) {
        console.error("Error occured while retrieving leaderboard:", error);
        return {
            leaderboard: [],
            error: "An unexpected database error has occured",
        };
    }
}

export async function createCompetition(organizationId: string, name: string, slug?: string | null, expiresAt?: Date | null, retainUntil?: Date | null): Promise<{ competition?: Competition, error?: string }> {
    try {
        if (!slug) slug = slugify(name, { lower: true, trim: true });

        const [competition] = await database.insert(competitions)
            .values({
                organization_id: organizationId,
                name,
                slug,
                ...(expiresAt && { expires_at: expiresAt }),
                ...(retainUntil && { retain_until: retainUntil })
            })
            .returning();

        return { competition: competition };
    } catch (error) {
        console.error("Error occured while creating competition:", error);
        return {
            competition: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function updateCompetitionStatusById(id: string, expiresAt: Date, retainUntil: Date): Promise<{ competition?: Competition, error?: string }> {
    try {
        const [competition] = await database.update(competitions)
            .set({
                expires_at: expiresAt,
                retain_until: retainUntil,
            })
            .where(eq(competitions.id, id))
            .returning();

        return { competition };
    } catch (error) {
        console.error("Error occured while updating competition status:", error);
        return {
            competition: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function removeCompetitionById(id: string): Promise<{ deleted: boolean, error?: string }> {
    try {
        const [competition] = await database.delete(competitions)
            .where(eq(competitions.id, id))
            .returning();

        return { deleted: true, };
    } catch (error) {
        console.error("Error occured while deleting competition:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        };
    }
}

export async function removeCompetitionBySlug(organizationId: string, slug: string): Promise<{ deleted: boolean, error?: string }> {
    try {
        const [competition] = await database.delete(competitions)
            .where(and(eq(competitions.organization_id, organizationId), eq(competitions.slug, slug)))
            .returning();

        return { deleted: true, };
    } catch (error) {
        console.error("Error occured while deleting competition by slug:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        };
    }
}