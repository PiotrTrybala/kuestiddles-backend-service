import { arrayOverlaps, eq, ilike, and, or } from "drizzle-orm";
import { database } from "../database/db";
// import { addRecent, getRecent } from "../controllers/recent";
import { landmarks, quests, questsSolved } from "../database/schema/games";
import { getRecentEntities } from "../controllers/recent";

export type Error = {
    code: number;
    error: string;
};

export type ListQuestsParams = {
    page: number,
    pageSize: number,
    title: string,
    labels: string[],
};

type Quest = typeof quests.$inferSelect;

export async function listQuests(organizationId: string, { page, pageSize, title, labels }: ListQuestsParams): Promise<{ quests: Quest[] }> {
    const offset = page * pageSize;
    const limit = pageSize;

    const conditions = [
        eq(quests.organization_id, organizationId)
    ];

    if (title && title.trim() !== "") {
        conditions.push(ilike(quests.title, `%${title}%`));
    }

    if (labels.length > 0) {
        conditions.push(arrayOverlaps(quests.labels, labels));
    }

    const result = await database.select()
        .from(quests)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .offset(offset)
        .limit(limit);

    return {
        quests: result,
    }
}

export async function getQuest(id: string): Promise<{ quest?: Quest, error?: Error }> {
    try {
        const quest = await database.query.quests.findFirst({
            where: eq(quests.id, id)
        });

        
        if (!quest) {
            return { error: { code: 404, error: "Quest not found" } };
        }

        const landmark = await database.query.landmarks.findFirst({
            where: eq(landmarks.id, quest.landmark_id!), // TODO: Check if this will cause bugs
        });

        if (!landmark) {
            return { error: { code: 404, error: "Quests landmark not found" } };
        }

        return { quest }
    } catch (error) {
        console.log('error detected:', error);
        return {
            error: { code: 500, error: "Internal error while retrieving quest" }
        };
    }
}

export async function getRecentQuests(organizationId: string, userId: string): Promise<{ quests: Quest[], error?: Error }> {
    try {

        const { entitiesIds } = await getRecentEntities('quests', organizationId, userId);

        const conditions = [];
        for (const id of entitiesIds) {
            conditions.push(eq(quests.id, id));
        }

        const result = await database.select()
            .from(quests)
            .where(conditions.length > 0 ? or(...conditions) : undefined);

        return {
            quests: result,
        }
    } catch (error) {
        console.log('error detected:', error);
        return {
            quests: [],
            error: {
                code: 500,
                error: "Internal error while retrieving recently edited quests"
            }
        }
    }

}

// export async function getRecentQuests(organizationId: string, userId: string): Promise<{ quests: Quest[], error?: Error }> { 
//     try {

//         const { recent, error } = await getRecent(organizationId, userId, 'quests');

//         if (error) {
//             return {
//                 quests: [],
//                 error: {
//                     code: 500,
//                     error: "Internal error while retrieving recent quests"
//                 }
//             }
//         }

//         const conditions = [];
//         for (const questId of recent) {
//             conditions.push(eq(quests.id, questId));
//         }

//         const result = await database.select()
//             .from(quests)
//             .where(conditions.length > 0 ? and(...conditions) : undefined);

//         return {
//             quests: result,
//         }

//     } catch(error) {
//         console.log('error detected:', error);
//         return {
//             quests: [],
//             error: {
//                 code: 500,
//                 error: "Internal error while retrieving quests",
//             }
//         }
//     }
// }

export type CreateQuestParams = {
    landmarkId: string,
    title: string,
    description: string,
    labels: string[],
    thumbnail?: string,
    assets?: string[],
    answers?: string[],
    points: number,
};

export async function createQuest(organizationId: string, { landmarkId, title, description, labels, thumbnail, answers, assets, points }: CreateQuestParams): Promise<{ quest?: Quest, error?: Error }> {
    try {
        const [quest] = await database.insert(quests).values({
            organization_id: organizationId,
            landmark_id: landmarkId,
            title,
            description,
            labels,
            thumbnail,
            assets,
            answers,
            points,
        }).returning();

        if (!quest) {
            return {
                error: { code: 400, error: "Failed to create new quest" },
            }
        }

        return { quest }
    } catch (error) {
        console.log('error detected:', error);
        return {
            error: { code: 500, error: "Internal error while creating new quest" }
        }
    }
}

export type UpdateQuestParams = {
    updates: {
        field: string,
        value: any,
    }[]
};

const ALLOWED_QUESTS_UPDATE_FIELDS = new Set([
    "title",
    "description",
    "labels",
    "thumbnail",
    "assets",
    "points",
    "landmark",
]);

export async function updateQuest(id: string, params: UpdateQuestParams): Promise<{ quest?: Quest, error?: Error }> {
    try {
        const updateData: any = {};

        for (const update of params.updates) {
            if (!ALLOWED_QUESTS_UPDATE_FIELDS.has(update.field)) {
                return { error: { code: 400, error: `Field ${update.field} is not allowed or does not exist` } };
            }

            if (update.field === "points") {
                const points = Number(update.value);
                if (isNaN(points)) return { error: { code: 400, error: "Points value is not a number" } };
                updateData.points = points;
                continue;
            }

            updateData[update.field] = update.value;
        }

        if (Object.keys(updateData).length === 0) {
            return { error: { code: 400, error: "No updates found" } };
        }

        const [updated] = await database.update(quests)
            .set(updateData)
            .where(eq(quests.id, id))
            .returning();

        if (!updated) return { error: { code: 404, error: "Quest to update was not found" } };

        return { quest: updated };
    } catch (error) {
        console.log('error detected:', error);
        return { error: { code: 500, error: "Internal error while updating quests" } };
    }
}

export async function deleteQuest(organizationId: string, id: string): Promise<{ error?: Error }> {
    try {
        const result = await database.delete(quests)
            .where(and(
                eq(quests.id, id),
                eq(quests.organization_id, organizationId)
            ))
            .returning();

        if (result.length === 0) {
            return { error: { code: 404, error: "Quest not found" } };
        }

        return {};
    } catch (error) {
        console.log('error detected:', error);
        return { error: { code: 500, error: "Internal error while deleting quest" } };
    }
}

export async function solveQuest(questId: string, userId: string, answers: string[]): Promise<{ solved: boolean, error?: string }> {
    try {

        const result = await database.query.questsSolved.findFirst({
            where: and(eq(questsSolved.user_id, userId), eq(questsSolved.quest_id, questId))
        })

        if (!result) {
            await database.insert(questsSolved).values({
                user_id: userId,
                quest_id: questId,
                solved: true,
            });
        }

        return {
            solved: true,
        }
    } catch (error) {
        console.log('error detected:', error);
        return {
            solved: false,
            error: "Internal error while solving quest",
        }
    }
}