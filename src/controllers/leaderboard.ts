import { redis } from "@/config/redis";
import { formatError, type RepositoryError } from "@/repositories/v3/v3";

export function getLeaderboardId(competitionId: string) {
    return `kuest:leaderboard:${competitionId}`;
}

export type LeaderboardEntry = {
    groupId: string,
    points: number,
};

export async function getLeaderboard(competitionId: string): Promise<{ leaderboard: LeaderboardEntry[], error?: RepositoryError }> {
    try {

        const result = await redis.zrevrange(getLeaderboardId(competitionId), 0, -1, "WITHSCORES");

        let leaderboard: LeaderboardEntry[] = [];
        for (let i = 0; i < leaderboard.length; i++) {
            const entry = result[i]!;
            leaderboard.push({
                groupId: entry[0],
                points: entry[1],
            });
        }

        return {
            leaderboard,
        }

    } catch(error) {
        console.error("Error occured while retrieving competitions leaderboard:", error);
        return {
            leaderboard: [],
            error: formatError(error)
        }
    }
}

export async function updateLeaderboard(competitionId: string, groupId: string, points: number): Promise<{ updated: boolean, error?: RepositoryError }> {
    try {
        const key = getLeaderboardId(competitionId);
        await redis.zadd(key, "groupId", groupId, "points", points);

        return {
            updated: true,
        }
    } catch(error) {
        console.error("Error occured while updating competitions leaderboard:", error);
        return {
            updated: false,
            error: formatError(error)
        }
    }
}