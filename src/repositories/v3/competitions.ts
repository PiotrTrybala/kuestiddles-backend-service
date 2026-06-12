
// Competitions CRUD actions

import { getLeaderboard, updateLeaderboard } from "@/controllers/leaderboard";
import { database } from "@/database/db";
import { competitions, groups, groupsQuests, groupUsers, quests } from "@/database/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import { UniqueConstraintBuilder } from "drizzle-orm/gel-core";
import slugify from "slugify";
import { getQuestById } from "./quests";

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

// COMPETITION USER METHOD
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

export async function updateCompetitionById(competitionId: string, name?: string, status?: "onboarding" | "in-progress" | "finishing" | "archived", finishesAt?: Date): Promise<{ competition?: Competition, error?: string }> {
    try {

        const updateBody: Partial<typeof competitions.$inferInsert> = {};
        if (name !== undefined) updateBody.name = name;
        if (status !== undefined) updateBody.status = status;
        if (finishesAt !== undefined) updateBody.finishes_at = finishesAt;

        if (Object.keys(updateBody).length === 0) {
            return {
                error: "No update parameters provided"
            };
        }

        const [competition] = await database.update(competitions)
            .set(updateBody)
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

export async function searchGroups(
    competitionId: string,
    page: number,
    pageSize: number,
    options?: {
        name?: string,
    }): Promise<{ groups: Group[], error?: string }> {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

        const name = options?.name ?? "";

        const filters = [
            eq(groups.competition_id, competitionId),
        ];

        if (name && name.length > 0) {
            filters.push(ilike(groups.name, `%${name}%`));
        }

        const results = await database.select()
            .from(groups)
            .where(and(...filters))
            .limit(limit)
            .offset(offset);

        return { groups: results, };
    } catch (error) {
        console.error("Error occured while retrieving groups:", error);
        return {
            groups: [],
            error: "An unexpected database error has occured",
        };
    }
}

export async function getGroupById(groupId: string): Promise<{ group?: Group, error?: string }> {
    try {
        const [group] = await database.select()
            .from(groups)
            .where(eq(groups.id, groupId));

        if (!group) {
            return {
                group: undefined,
                error: "Group has not been found",
            };
        }

        return { group };
    } catch (error) {
        console.error("Error occured while retrieving group:", error);
        return {
            group: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function getGroupBySlug(competitionId: string, slug: string): Promise<{ group?: Group, error?: string }> {
    try {
        const [group] = await database.select()
            .from(groups)
            .where(and(eq(groups.competition_id, competitionId), eq(groups.slug, slug)));

        if (!group) {
            return {
                group: undefined,
                error: "Group has not been found",
            };
        }

        return { group };
    } catch (error) {
        console.error("Error occured while retrieving group by slug:", error);
        return {
            group: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function createGroup(competitionId: string, name: string, slug?: string): Promise<{ group?: Group, error?: string }> {
    try {
        if (!slug) slug = slugify(name, { lower: true, trim: true });

        const [group] = await database.insert(groups)
            .values({
                competition_id: competitionId,
                slug,
                name,
            })
            .returning();

        return { group: group };
    } catch (error) {
        console.error("Error occured while creating competitions group:", error);
        return {
            group: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

// ONLY FOR COMPETITION GROUP USER
export async function solveGroupQuest(competitionId: string, groupId: string, questId: string, answers: string[]): Promise<{ solved: boolean, error?: string }> {
    try {
        const { quest, error } = await getQuestById(questId);
        if (!quest || error) {
            return { solved: false, error: "Quest has not been found" };
        }

        const [existing] = await database.select()
            .from(groupsQuests)
            .where(
                and(
                    eq(groupsQuests.group_id, groupId),
                    eq(groupsQuests.quest_id, questId),
                )
            );

        if (!existing) {
            return { solved: true, error: "Quest has already been solved" };
        }

        const correctAnswers = quest!.answers ?? [];
        const isCorrect = answers.some((answer) =>
            correctAnswers.some((correct) => correct.toLowerCase() === answer.toLowerCase())
        );

        if (!isCorrect) {
            return { solved: false, error: "Incorrect answer" };
        }

        await database.insert(groupsQuests)
            .values({
                group_id: groupId,
                quest_id: questId,
            });

        const { leaderboard } = await getLeaderboard(competitionId);
        const groupEntry = leaderboard.find(entry => entry.groupId);
        if (!groupEntry) {
            return {
                solved: false,
                error: "Group leaderboard entry has not been found",
            }
        }

        await updateLeaderboard(competitionId, groupId, groupEntry.points + quest.points);

        return { solved: true };
    } catch (error) {
        console.error("Error occured while solving quest:", error);
        return {
            solved: false,
            error: "An unexpected database error has occured",
        };
    }
}

export async function deleteGroupById(groupId: string): Promise<{ deleted: boolean, error?: string }> {
    try {
        const [group] = await database.delete(groups)
            .where(eq(groups.id, groupId))
            .returning();

        return { deleted: true };
    } catch (error) {
        console.error("Error occured while deleting competition group:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        };
    }
}

export async function deleteGroupBySlug(competitionId: string, slug: string): Promise<{ deleted: boolean, error?: string }> {
    try {
        const [group] = await database.delete(groups)
            .where(and(eq(groups.competition_id, competitionId), eq(groups.slug, slug)))
            .returning();

        return { deleted: true };
    } catch (error) {
        console.error("Error occured while deleting competition group:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        };
    }
}

// Users subsection

export async function getUsers(groupId: string): Promise<{ users: User[], error?: string }> { 
    try {
        const users = await database.select()
            .from(groupUsers)
            .where(eq(groupUsers.group_id, groupId));
        return {
            users,
        }

    } catch(error) {
        console.log("Error occured while retrieving group users:", error);
        return {
            users: [],
            error: "An unknown database error has occured",
        }
    }
}

type Souvenir = {
    username: string,
    groupName: string,
    points: number,
};

export async function getSouvenir(competitionId: string, groupId: string, userId: string): Promise<{ souvenir?: Souvenir, error?: string }> { 
    try {
        const [user] = await database.select()
            .from(groupUsers)
            .where(and(eq(groupUsers.id, userId), eq(groupUsers.group_id, groupId)));

        if (!user) {
            throw new Error("User has not been found.");
        }

        const { leaderboard } = await getLeaderboard(competitionId);
        const entry = leaderboard.find(entry => entry.groupId);
        if (!entry) {
            throw new Error("Leaderboard entry has not been found.");
        }

        const [group] = await database.select()
            .from(groups)
            .where(eq(groups.id, groupId));

        if (!group) {
            throw new Error("Group has not been found.");
        }

        return {
            souvenir: {
                username: user.username,
                groupName: group.name,
                points: entry.points,
            }
        }

    } catch(error) {
        console.log("Error occured while retrieving leaderboard:", error);
        return {
            souvenir: undefined,
            error: "An unknown database error has occured",
        }
    }
}

export async function createUser(competitionId: string, groupId: string, username: string): Promise<{ user?: User, error?: string }> { 
    try {

        const [user] = await database.insert(groupUsers)
            .values({
                group_id: groupId,
                username,
            })
            .returning();

        return { user: user };
    } catch (error) {
        console.error("Error occured while creating competition group users:", error);
        return {
            user: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function deleteUserById(userId: string): Promise<{ deleted: boolean, error?: string }> { 
    try {
        const [competition] = await database.delete(groupUsers)
            .where(eq(groupUsers.id, userId))
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

export async function deleteUserByUsername(groupId: string, username: string): Promise<{ deleted: boolean, error?: string }> { 
    try {
        const [competition] = await database.delete(groupUsers)
            .where(and(eq(groupUsers.group_id, groupId), eq(groupUsers.username, username)))
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