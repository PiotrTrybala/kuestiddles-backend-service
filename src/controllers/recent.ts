import { redis } from "../config/redis";

// export const RECENT_LIMIT = 4;

// export const recentId = (organizationId: string, userId: string, type: 'quests' | 'landmarks') => {
//     return `recent:${organizationId}:${type}:${userId}`;
// }

export const RECENT_ENTITY_LIMIT = 5;

export type EntityType = 'quests' | 'landmarks';

export const recentEntityID = (type: EntityType, organizationId: string, userId: string) => {
    return `kuest:${type}:${organizationId}:${userId}`;
};

export async function getRecentEntities(type: EntityType, organizationId: string, userId: string): Promise<{ entitiesIds: string[], error?: Error }> {

    try {

        const id = recentEntityID(type, organizationId, userId);
        const entitiesIds = await redis.lrange(id, 0, -1); // Read entire queue

        console.log(id,":", entitiesIds);

        return {
            entitiesIds,
        }
    } catch(error) {
        console.log('error detected:', error);
        throw new Error("Failed to load recent entities", {
            cause: error,
        });
    }

}

export async function registerRecentEntity(type: EntityType, organizationId: string, userId: string, entityId: string): Promise<{ questsIds: string[], error?: string}> {

    try {

        const id = recentEntityID(type, organizationId, userId);


        await redis.lpush(id, entityId);
        const size = await redis.llen(id);
        if (size - 1 === RECENT_ENTITY_LIMIT) {
            await redis.lpop(id);
        }

        await redis.ltrim(id, 0, RECENT_ENTITY_LIMIT - 1); // Check if this command will cause trouble

        // await redis.lrem(id, 0, entityId);
        // await redis.lpush(id, entityId);
        // await redis.ltrim(id, 0, RECENT_ENTITY_LIMIT - 1);

        const updated = await redis.lrange(id, 0, -1);

        return {
            questsIds: updated,
        }
    } catch(error) {
        throw new Error("Failed to register new recent entity", {
            cause: error,
        });
    }

}