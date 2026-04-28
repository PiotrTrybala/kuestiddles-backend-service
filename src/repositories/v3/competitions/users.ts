import { database } from "@/database/db";
import { competitions, groups, groupUsers, invites, leaderboard, groupSolves } from "@/database/schema";
import { quests } from "@/database/schema/games";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";


export async function getCompetitionQuests(competitionId: string) {
    try {
        const questResults = await database.select()
            .from(groupSolves)
            .innerJoin(groups, eq(groupSolves.group_id, groups.id))
            .innerJoin(quests, eq(groupSolves.quest_id, quests.id))
            .where(eq(groups.competition_id, competitionId));

        return { quests: questResults };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            quests: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupsUsers(competitionId: string) {
    try {
        const users = await database.select()
            .from(groupUsers)
            .innerJoin(groups, eq(groupUsers.group_id, groups.id))
            .where(eq(groups.competition_id, competitionId));

        return { users };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            users: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getCompetitionsLeaderboard(competitionId: string) {
    try {
        const entries = await database.select()
            .from(leaderboard)
            .innerJoin(groups, eq(leaderboard.group_id, groups.id))
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

export async function getSouvenirCertificate(competitionId: string, groupId: string) {
    try {
        const [entry] = await database.select({
            points: leaderboard.points,
            group_name: groups.name,
            members: groups.members,
        })
            .from(leaderboard)
            .innerJoin(groups, eq(leaderboard.group_id, groups.id))
            .where(
                and(
                    eq(leaderboard.competition_id, competitionId),
                    eq(leaderboard.group_id, groupId),
                )
            );

        if (!entry) {
            return { certificate: undefined, error: "Leaderboard entry has not been found" };
        }

        const solves = await database.select({
            quest_id: groupSolves.quest_id,
            solved: groupSolves.solved,
            title: quests.title,
            points: quests.points,
        })
            .from(groupSolves)
            .innerJoin(quests, eq(groupSolves.quest_id, quests.id))
            .where(
                and(
                    eq(groupSolves.group_id, groupId),
                    eq(groupSolves.solved, true),
                )
            );

        return {
            certificate: {
                group_name: entry.group_name,
                members: entry.members,
                total_points: entry.points,
                solves,
            },
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            certificate: undefined,
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
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}
