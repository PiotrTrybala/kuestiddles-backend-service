import { database } from "@/database/db";
import { competitions, groups, groupUsers, invites, leaderboard, groupSolves } from "@/database/schema";
import { quests } from "@/database/schema";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";

type CompetitionGroup = typeof groups.$inferSelect;
type CompetitionUser = typeof groupUsers.$inferSelect;

export async function searchGroups(competitionId: string, page: number, pageSize: number, name?: string): Promise<{ groups: CompetitionGroup[], error?: string }> {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

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

export async function getGroupById(id: string): Promise<{ group?: CompetitionGroup, error?: string }> {
    try {
        const [group] = await database.select()
            .from(groups)
            .where(eq(groups.id, id));

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

export async function getGroupBySlug(competitionId: string, slug: string): Promise<{ group?: CompetitionGroup, error?: string }> {
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

export async function getGroupUsers(groupId: string): Promise<{ users: CompetitionUser[], error?: string }> {
    try {
        const users = await database.select()
            .from(groupUsers)
            .where(eq(groupUsers.group_id, groupId));

        return { users };
    } catch (error) {
        console.error("Error occured while retreving competition groups users:", error);
        return {
            users: [],
            error: "An unexpected database error has occured",
        };
    }
}

export async function createGroup(competitionId: string, name: string, slug?: string | null): Promise<{ group?: CompetitionGroup, error?: string }> {
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

export async function solveQuest(groupId: string, questId: string, answers: string[]): Promise<{ solved: boolean, error?: string }> {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(eq(quests.id, questId));

        if (!quest) {
            return { solved: false, error: "Quest has not been found" };
        }

        const [existing] = await database.select()
            .from(groupSolves)
            .where(
                and(
                    eq(groupSolves.group_id, groupId),
                    eq(groupSolves.quest_id, questId),
                )
            );

        if (existing?.solved) {
            return { solved: true, error: "Quest has already been solved" };
        }

        const correctAnswers = quest!.answers ?? [];
        const isCorrect = answers.some((answer) =>
            correctAnswers.some((correct) => correct.toLowerCase() === answer.toLowerCase())
        );

        if (!isCorrect) {
            return { solved: false, error: "Incorrect answer" };
        }

        if (existing) {
            await database.update(groupSolves)
                .set({ solved: true })
                .where(
                    and(
                        eq(groupSolves.group_id, groupId),
                        eq(groupSolves.quest_id, questId),
                    )
                );
        } else {
            await database.insert(groupSolves)
                .values({
                    group_id: groupId,
                    quest_id: questId,
                    solved: true,
                });
        }

        await database.update(leaderboard)
            .set({ points: sql`${leaderboard.points} + ${quest.points}` })
            .where(eq(leaderboard.group_id, groupId));

        return { solved: true };
    } catch(error) {
        console.error("Error occured while solving quest:", error);
        return {
            solved: false,
            error: "An unexpected database error has occured",
        };
    }
}

export async function removeGroupById(id: string): Promise<{ deleted: boolean, error?: string }> {
    try {
        const [group] = await database.delete(groups)
            .where(eq(groups.id, id))
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