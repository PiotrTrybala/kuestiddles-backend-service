import { database } from "@/database/db";
import { quests } from "@/database/schema";
import { and, arrayOverlaps, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";
import { formatError, type RepositoryError } from "./repositories";

type Quest = typeof quests.$inferSelect;
type QuestInsert = typeof quests.$inferInsert;

export async function searchQuests(organizationId: string, page: number, pageSize: number, title?: string, labels?: string[]): Promise<{ quests: Quest[], error?: RepositoryError }> {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

        const filters = [
            eq(quests.organization_id, organizationId),
        ];

        if (title && title.length > 0) {
            filters.push(ilike(quests.title, `%${title}%`));
        }

        if (labels && labels.length > 0) {
            filters.push(arrayOverlaps(quests.labels, labels));
        }

        const searchResults = await database.select()
            .from(quests)
            .where(and(...filters))
            .limit(limit)
            .offset(offset);

        return {
            quests: searchResults,
        };
    } catch (error) {
        console.error("Error occured while retriving organizations quests:", error);
        return {
            quests: [],
            error: formatError(error),
        };
    }
}

export async function getQuestById(id: string): Promise<{ quest?: Quest, error?: RepositoryError }> {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(eq(quests.id, id));

        if (!quest) {
            return {
                quest: undefined,
                error: { message: "Quest has not been found", status: 404 }
            };
        }

        return {
            quest: quest,
        };
    } catch (error) {
        console.error("Error occured while retriving quest:", error);
        return {
            quest: undefined,
            error: formatError(error),
        };
    }
}

export async function getQuestsByGameId(gameId: string): Promise<{ quests: Quest[], error?: RepositoryError }> {
    try {
        const results = await database.select()
            .from(quests)
            .where(eq(quests.game_id, gameId));

        return {
            quests: results,
        };
    } catch (error) {
        console.error("Error occured while retriving quests by game id:", error);
        return {
            quests: [],
            error: formatError(error),
        };
    }
}

export async function getQuestBySlug(organizationId: string, slug: string): Promise<{ quest?: Quest, error?: RepositoryError }> {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(and(eq(quests.organization_id, organizationId), eq(quests.slug, slug)));

        if (!quest) {
            return {
                quest: undefined,
                error: { message: "Quest has not been found", status: 404 }
            };
        }

        return {
            quest: quest,
        };
    } catch (error) {
        console.error("Error occured while retriving quest by slug:", error);
        return {
            quest: undefined,
            error: formatError(error),
        };
    }
}

export async function checkQuestSlug(organizationId: string, slug: string): Promise<{ open: boolean, error?: RepositoryError }> {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(and(eq(quests.organization_id, organizationId), eq(quests.slug, slug)));

        return { 
            open: !quest 
        };
    } catch (error) {
        console.error("Error occured while checking validity of quests slug:", error);
        return { 
            open: false,
            error: formatError(error)
        };
    }
}

export async function createQuest(
    organizationId: string, 
    landmarkId: string, 
    title: string, 
    description: string, 
    points: number, 
    gameId: string, 
    slug?: string, 
    labels?: string[], 
    answers?: string[], 
    thumbnail?: string
): Promise<{ id?: string, error?: RepositoryError }> {
    try {
        if (!slug) slug = slugify(title, { lower: true, trim: true });

        const [quest] = await database.insert(quests)
            .values({
                slug,
                organization_id: organizationId,
                landmark_id: landmarkId,
                game_id: gameId,
                title,
                description,
                points,
                labels,
                answers,
                thumbnail
            }).returning();

        return {
            id: quest?.id,
        };
    } catch (error) {
        console.error("Error occured while creating new quest:", error);
        return {
            id: undefined,
            error: formatError(error),
        };
    }
}

export async function updateQuest(id: string, title?: string, description?: string, points?: number, landmark_id?: string, game_id?: string): Promise<{ updated?: Quest, error?: RepositoryError }> {
    try {

        const updateBody: Partial<typeof quests.$inferInsert> = {};
        if (title !== undefined) updateBody.title = title;
        if (description !== undefined) updateBody.description = description;
        if (points !== undefined) updateBody.points = points;
        if (landmark_id !== undefined) updateBody.landmark_id = landmark_id;
        if (game_id !== undefined) updateBody.game_id = game_id;

        if (Object.keys(updateBody).length === 0) {
            return {
                error: { message: "No update parameters provided", status: 400 }
            };
        }

        const [quest] = await database.update(quests)
            .set(updateBody)
            .where(eq(quests.id, id))
            .returning();

        return {
            updated: quest,
        }
    } catch (error) {
        // TODO: Add errors related to landmarks and games relations
        console.error("Error occured while updating quest:", error);
        return {
            updated: undefined,
            error: formatError(error),
        };
    }
}

export async function updateQuestThumbnail(id: string, thumbnail: string): Promise<{ updated?: Quest, error?: RepositoryError }> {
    try {
        const [quest] = await database.update(quests)
            .set({ thumbnail })
            .where(eq(quests.id, id))
            .returning();

        return {
            updated: quest,
        };
    } catch (error) {
        console.error("Error occured while updating quests thumbnail:", error);
        return {
            updated: undefined,
            error: formatError(error),
        };
    }
}

export async function updateQuestLabels(id: string, labels: string[]): Promise<{ updated?: Quest, error?: RepositoryError }> {
    try {
        const [quest] = await database.update(quests)
            .set({ labels })
            .where(eq(quests.id, id))
            .returning();

        return {
            updated: quest,
        };
    } catch (error) {
        console.error("Error occured while updating quests labels:", error);
        return {
            updated: undefined,
            error: formatError(error),
        };
    }
}

export async function updateQuestAnswers(id: string, answers: string[]): Promise<{ updated?: Quest, error?: RepositoryError }> {
    try {
        const [quest] = await database.update(quests)
            .set({ answers })
            .where(eq(quests.id, id))
            .returning();

        return {
            updated: quest,
        };
    } catch (error) {
        console.error("Error occured while updating quests answers:", error);
        return {
            updated: undefined,
            error: formatError(error),
        };
    }
}

export async function removeQuestById(id: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
    try {
        const [quest] = await database.delete(quests)
            .where(eq(quests.id, id))
            .returning();

        return {
            deleted: true,
        };
    } catch (error) {
        console.error("Error occured while removing quest:", error);
        return {
            deleted: false,
            error: formatError(error),
        };
    }
}

export async function removeQuestByGameId(gameId: string): Promise<{ deleted: boolean, count: number, error?: RepositoryError }> {
    try { 
        const deletedQuests = await database.delete(quests)
            .where(eq(quests.game_id, gameId))
            .returning();

        return {
            deleted: true,
            count: deletedQuests.length,
        };
    } catch (error) {
        console.error("Error occured while deleting quests by game id:", error);
        return {
            deleted: false,
            count: 0,
            error: formatError(error),
        };
    }
}

export async function removeQuestBySlug(organizationId: string, slug: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
    try {
        const [quest] = await database.delete(quests)
            .where(and(eq(quests.organization_id, organizationId), eq(quests.slug, slug)))
            .returning();

        return {
            deleted: true,
        };
    } catch (error) {
        console.error("Error occured while deleting quest by slug:", error);
        return {
            deleted: false,
            error: formatError(error),
        };
    }
}