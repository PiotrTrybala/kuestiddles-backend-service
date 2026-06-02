
// Competitions CRUD actions

import { database } from "@/database/db";
import { competitions, groups, groupUsers, quests } from "@/database/schema";
import { eq, ilike, and } from "drizzle-orm";
import slugify from "slugify";

type Competition = typeof competitions.$inferSelect;
type Quest = typeof quests.$inferSelect;

export async function searchCompetitions(
    organizationId: string,
    page: number,
    pageSize: number,
    options?: {
        name?: string,
    }): Promise<{ competitions: Competition[], error?: string }> {
    try {

        const name = options?.name ?? "";

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

export async function getCompetitionById(competitionId: string): Promise<{ competition?: Competition, error?: string }> {
    try {
        const [competition] = await database.select()
            .from(competitions)
            .where(eq(competitions.id, competitionId));

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

export async function getCompetitionsQuests(competitionId: string): Promise<{ quests: Quest[], error?: string }> {
    try {
        const { competition, error } = await getCompetitionById(competitionId);
        if (error || !competition) {
            throw new Error(error);
        }

        const competitionQuests = await database.select()
            .from(quests)
            .where(eq(quests.game_id, competition.game_id));

        return {
            quests: competitionQuests,
        }
    } catch (error) {
        console.log("Error occured while retrieving competitions quests:", error);
        return {
            quests: [],
            error: "An unknown database error has occured",
        }
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

export async function checkCompetitionSlug(organizationId: string, slug: string): Promise<{ isVacant: boolean, error?: string }> {
    try {
        const [competition] = await database.select()
            .from(competitions)
            .where(and(eq(competitions.organization_id, organizationId), eq(competitions.slug, slug)));

        if (competition) {
            return {
                isVacant: false,
                error: "Slug is already taken",
            };
        }

        return { isVacant: true };
    } catch (error) {
        console.error("Error occured while checking competition slug:", error);
        return {
            isVacant: false,
            error: "An unexpected database error has occured",
        };
    }
}

export async function createCompetition(organizationId: string, gameId: string, name: string, slug?: string, finishesAt?: Date): Promise<{ competition?: Competition, error?: string }> {
    try {
        if (!slug) slug = slugify(name, { lower: true, trim: true });

        const [competition] = await database.insert(competitions)
            .values({
                organization_id: organizationId,
                game_id: gameId,
                name,
                slug,
                ...(finishesAt && { finishes_at: finishesAt }),
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

export async function updateCompetitionById(competitionId: string, name: string, finishesAt: Date): Promise<{ competition?: Competition, error?: string }> {
    try {
        const [competition] = await database.update(competitions)
            .set({
                name: name,
                finishes_at: finishesAt,
            })
            .where(eq(competitions.id, competitionId))
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

export async function deleteCompetitionById(competitionId: string): Promise<{ deleted: boolean, error?: string }> {
    try {
        const [competition] = await database.delete(competitions)
            .where(eq(competitions.id, competitionId))
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

export async function deleteCompetitionBySlug(organizationId: string, slug: string): Promise<{ deleted: boolean, error?: string }> { 
    try {
        const [competition] = await database.delete(competitions)
            .where(and(eq(competitions.organization_id, organizationId), eq(competitions.slug, slug)))
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

// Groups and Users CRUD actions

type Group = typeof groups.$inferSelect;
type User = typeof groupUsers.$inferSelect;

export async function searchGroups(competitionId: string, page: number, pageSize: number, options?: { name?: string, labels?: string[] }) { }

export async function getGroupById(groupId: string) { }

export async function getGroupBySlug(competitionId: string, slug: string) { }

export async function createGroup(competitionId: string, name: string, slug?: string) { }

export async function solveGroupQuest(groupId: string, questId: string, answers: string[]) { }

export async function updateGroupById(groupId: string, name: string) { }

export async function deleteGroupById(groupId: string) { }

export async function deleteGroupBySlug(competitionId: string, slug: string) { }

// Users subsection

export async function getUsers(groupId: string) { }

export async function getSouvenir(competitionId: string, groupId: string, userId: string) { }

export async function createUser(competitionId: string, groupId: string, username: string) { }

export async function deleteUser(groupId: string, username: string) { }