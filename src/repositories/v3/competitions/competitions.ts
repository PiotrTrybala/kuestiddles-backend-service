import { database } from "@/database/db";
import { competitions, groups, groupUsers, invites, leaderboard, groupSolves } from "@/database/schema";
import { quests } from "@/database/schema/games";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";


export async function searchCompetitions(organizationId: string, page: number, pageSize: number, name?: string) {
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

        return { results };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            results: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getCompetitionById(id: string) {
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
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getCompetitionBySlug(organizationId: string, slug: string) {
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
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getLeaderboard(competitionId: string) {
    try {
        const entries = await database.select()
            .from(leaderboard)
            .where(eq(leaderboard.competition_id, competitionId))
            .orderBy(desc(leaderboard.points));

        return { entries };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            entries: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function createCompetition(organizationId: string, name: string, slug?: string | null, expiresAt?: Date | null, retainUntil?: Date | null) {
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

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function updateCompetitionStatusById(id: string, expiresAt: Date, retainUntil: Date) {
    try {
        const [competition] = await database.update(competitions)
            .set({
                expires_at: expiresAt,
                retain_until: retainUntil,
            })
            .where(eq(competitions.id, id))
            .returning();

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function removeCompetitionById(id: string) {
    try {
        const [competition] = await database.delete(competitions)
            .where(eq(competitions.id, id))
            .returning();

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}

export async function removeCompetitionBySlug(organizationId: string, slug: string) {
    try {
        const [competition] = await database.delete(competitions)
            .where(and(eq(competitions.organization_id, organizationId), eq(competitions.slug, slug)))
            .returning();

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}