import { redis } from "../config/redis";

export const RECENT_LIMIT = 4;

export const recentId = (organizationId: string, userId: string, type: 'quests' | 'landmarks') => {
    return `recent:${organizationId}:${type}:${userId}`;
}

export async function getRecentQuests(organizationId: string, userId: string): Promise<{ questIds: string[], error?: string }> {
    try {
        const quests = await redis.lrange(recentId(organizationId, userId, 'quests'), 0, -1);
        return { questIds: quests };
    } catch (error) {
        console.error('Error fetching quests:', error);
        return { questIds: [], error: String(error) };
    }
}

export async function addQuest(organizationId: string, userId: string, questId: string): Promise<{ questIds: string[], error?: string }> {
    try {
        const id = recentId(organizationId, userId, 'quests');

        await redis.lrem(id, 0, questId);
        await redis.lpush(id, questId);
        await redis.ltrim(id, 0, RECENT_LIMIT - 1);

        const updatedQuests = await redis.lrange(id, 0, -1);
        
        return { questIds: updatedQuests };
        
    } catch(error) {
        console.error('Error adding quest:', error);
        return { questIds: [], error: String(error) };
    }
}

export async function getRecentLandmarks(organizationId: string, userId: string) {

}

export async function addLandmark(organizationId: string, userId: string, landmarkId: string) {

}