import { groups, groupSolves, groupUsers, leaderboard, quests } from "@/database/schema"
import { getCompetitionById } from "./competitions";
import { database } from "@/database/db";
import { and, eq, sql } from "drizzle-orm";

type Quest = typeof quests.$inferSelect;
type Group = typeof groups.$inferSelect;
type GroupUser = typeof groupUsers.$inferSelect;
type Leaderboard = typeof leaderboard.$inferSelect;
type Souvenir = {
    username: string,
    groupName: string,
    points: number,
}

export async function getCompetitionQuests(competitionId: string): Promise<{ quests: Quest[], error?: string }> {
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
    } catch(error) {
        console.log("Error occured while retrieving competitions quests:", error);
        return {
            quests: [],
            error: "An unknown database error has occured",
        }
    }

}

export async function getGroupUsers(groupId: string): Promise<{ users: GroupUser[], error?: string }> {
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

export async function getLeaderboard(competitionId: string): Promise<{ entries: Leaderboard[], groups: Group[], error?: string }> {
    try {

        const entries = await database.select()
            .from(leaderboard)
            .where(eq(leaderboard.competition_id, competitionId));

        const competitionGroups = await database.select()
            .from(groups)
            .where(eq(groups.competition_id, competitionId));

        return {
            entries: entries,
            groups: competitionGroups,
        }
    } catch(error) {
        console.log("Error occured while retrieving leaderboard:", error);
        return {
            entries: [],
            groups: [],
            error: "An unknown database error has occured",
        }
    }

}

export async function getSouvenir(competitionId: string, groupId: string, userId: string): Promise<{ souvenir?: Souvenir, error?: string }> {
    try {

        const [user] = await database.select()
            .from(groupUsers)
            .where(and(eq(groupUsers.id, userId), eq(groupUsers.group_id, groupId)));

        if (!user) {
            throw new Error("User has not been found.");
        }

        const [entry] = await database.select()
            .from(leaderboard)
            .where(and(eq(leaderboard.group_id, groupId), eq(leaderboard.competition_id, competitionId)));

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
