import { redis } from "@/config/redis";

export function getLeaderboardId(competitionId: string) {
    return `kuest:leaderboard:${competitionId}`;
}

export type LeaderboardEntry = {
    groupId: string,
    points: number,
};

export async function getLeaderboard(competitionId: string): Promise<{ leaderboard: LeaderboardEntry[], error?: string }> {
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
            error: "An unknown database error has occured"
        }
    }
}

export async function updateLeaderboard(competitionId: string, groupId: string, points: number): Promise<{ updated: boolean, error?: string }> {
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
            error: "An unknown database error has occured"
        }
    }
}