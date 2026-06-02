import { redis } from "@/config/redis";

const RECENT_OBJECT_LIST_LIMIT = 5;
export type ObjectType = "quest" | "landmark";

export function getObjectId(type: ObjectType, organizatonId: string, userId: string) {
    return `kuest:${type}:${organizatonId}:${userId}`;
};

async function getRecentObjects(type: ObjectType, organizationId: string, userId: string): Promise<{ ids: string[], error?: string }> {
    try {
        const id = getObjectId(type, organizationId, userId);
        const objectsIds = await redis.lrange(id, 0, -1);

        return {
            ids: objectsIds,
        }
    } catch(error) {
        console.log('error occured while retriving recent objects:', error);
        return {
            ids: [],
            error: "Error occured while retriving recent objects: " + type,
        }
    }
}

async function addRecentObject(type: ObjectType, organizationId: string, userId: string, objectId: string): Promise<{ updated: string[], error?: string }> {
    try {

        const id = getObjectId(type, organizationId, userId);

        await redis.lpush(id, objectId);
        const currentObjectsListSize = await redis.llen(id);
        if (currentObjectsListSize - 1 == RECENT_OBJECT_LIST_LIMIT) {
            await redis.lpop(id);
        }

        const updated = await redis.lrange(id, 0, -1);

        return {
            updated,
        }
    } catch(error) {
        console.log('error occured while adding new object to recent objects:', error);
        return {
            updated: [],
            error: "Error occured while adding new object to recent objects: " + type,
        }
    }
}

export async function getRecentQuests(organizationId: string, userId: string): Promise<{ ids: string[], error?: string }> {
    return getRecentObjects("quest", organizationId, userId);
}

export async function addRecentQuest(organizationId: string, userId: string, questId: string) {
    return addRecentObject("quest", organizationId, userId, questId);
}

export async function getRecentLandmarks(organizationId: string, userId: string) {
    return getRecentObjects("landmark", organizationId, userId);
}

export async function addRecentLandmark(organizationId: string, userId: string, landmarkId: string) {
    return addRecentObject("landmark", organizationId, userId, landmarkId);
}
