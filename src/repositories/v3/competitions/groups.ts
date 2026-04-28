import { database } from "@/database/db";
import { competitions, groups, groupUsers, invites, leaderboard, groupSolves } from "@/database/schema";
import { quests } from "@/database/schema/games";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";


export async function searchGroups(competitionId: string, page: number, pageSize: number, name?: string) {
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

        return { results };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            results: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupById(id: string) {
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
        console.error("Internal database error:", error);
        return {
            group: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupBySlug(competitionId: string, slug: string) {
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
        console.error("Internal database error:", error);
        return {
            group: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupUsers(groupId: string) {
    try {
        const users = await database.select()
            .from(groupUsers)
            .where(eq(groupUsers.group_id, groupId));

        return { users };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            users: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function createGroup(competitionId: string, name: string, slug?: string | null) {
    try {
        if (!slug) slug = slugify(name, { lower: true, trim: true });

        const [group] = await database.insert(groups)
            .values({
                competition_id: competitionId,
                slug,
                name,
            })
            .returning();

        return { id: group?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            group: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function solveQuest(groupId: string, questId: string, answers: string[]) {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(eq(quests.id, questId));

        if (!quest) {
            return { error: "Quest has not been found" };
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
            return { error: "Quest has already been solved" };
        }

        const correctAnswers = quest!.answers ?? [];
        const isCorrect = answers.some((answer) =>
            correctAnswers.some((correct) => correct.toLowerCase() === answer.toLowerCase())
        );

        if (!isCorrect) {
            return { error: "Incorrect answer" };
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

        return { success: true };
    } catch(error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}

export async function removeGroupById(id: string) {
    try {
        const [group] = await database.delete(groups)
            .where(eq(groups.id, id))
            .returning();

        return { id: group?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}