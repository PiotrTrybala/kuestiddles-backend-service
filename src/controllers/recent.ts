import { redis } from "../config/redis";

export const RECENT_LIMIT = 4;

export const recentId = (organizationId: string, userId: string, type: 'quests' | 'landmarks') => {
    return `recent:${organizationId}:${type}:${userId}`;
}

export async function getRecent(organizationId: string, userId: string, type: 'quests' | 'landmarks'): Promise<{ recent: string[], error?: string }> {
    try {
        const quests = await redis.lrange(recentId(organizationId, userId, type), 0, -1);
        return { recent: quests };
    } catch (error) {
        console.error('Error fetching quests:', error);
        return { recent: [], error: String(error) };
    }
}

export async function addRecent(organizationId: string, userId: string, id: string, type: 'quests' | 'landmarks'): Promise<{ recent: string[], error?: string }> {
    try {
        const id = recentId(organizationId, userId, type);

        await redis.lrem(id, 0, id);
        await redis.lpush(id, id);
        await redis.ltrim(id, 0, RECENT_LIMIT - 1);

        const updated = await redis.lrange(id, 0, -1);

        return { recent: updated };
        
    } catch(error) {
        console.error('Error adding quest:', error);
        return { recent: [], error: String(error) };
    }
}