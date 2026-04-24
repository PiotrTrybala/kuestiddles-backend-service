import { database } from "@/database/db";
import { quests } from "@/database/schema";
import { and, arrayOverlaps, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";

export async function searchQuests(organizationId: string, page: number, pageSize: number, title?: string, labels?: string[]) {
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
            results: searchResults,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            results: [],
            error: "An unexpected database error occurred",
        };
    }
}

export async function getQuestById(id: string) {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(eq(quests.id, id));

        if (!quest) {
            return {
                quest: undefined,
                error: "Quest has not been found"
            };
        }

        return {
            quest: quest,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            quest: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function getQuestsByGameId(gameId: string) {
    try {
        const results = await database.select()
            .from(quests)
            .where(eq(quests.game_id, gameId));

        return {
            quests: results,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            quests: [],
            error: "An unexpected database error occurred",
        };
    }
}

export async function getQuestBySlug(organizationId: string, slug: string) {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(and(eq(quests.organization_id, organizationId), eq(quests.slug, slug)));

        if (!quest) {
            return {
                quest: undefined,
                error: "Quest has not been found"
            };
        }

        return {
            quest: quest,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            quest: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function checkQuestSlug(organizationId: string, slug: string) {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(and(eq(quests.organization_id, organizationId), eq(quests.slug, slug)));

        return !quest;
    } catch (error) {
        console.error("Internal database error:", error);
        return false;
    }
}

export async function createQuest(
    organizationId: string, 
    landmarkId: string, 
    title: string, 
    description: string, 
    points: number, 
    gameId?: string, 
    slug?: string, 
    labels?: string[], 
    answers?: string[], 
    thumbnail?: string
) {
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
        console.error("Internal database error:", error);
        return {
            id: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function updateQuest(id: string, data: { title?: string, description?: string, points?: number, landmark_id?: string }) {
    try {
        const [quest] = await database.update(quests)
            .set(data)
            .where(eq(quests.id, id))
            .returning();

        return {
            id: quest?.id,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            id: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function updateQuestThumbnail(id: string, thumbnail: string) {
    try {
        const [quest] = await database.update(quests)
            .set({ thumbnail })
            .where(eq(quests.id, id))
            .returning();

        return {
            id: quest?.id,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            id: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function updateQuestLabels(id: string, labels: string[]) {
    try {
        const [quest] = await database.update(quests)
            .set({ labels })
            .where(eq(quests.id, id))
            .returning();

        return {
            id: quest?.id,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            id: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function updateQuestAnswers(id: string, answers: string[]) {
    try {
        const [quest] = await database.update(quests)
            .set({ answers })
            .where(eq(quests.id, id))
            .returning();

        return {
            id: quest?.id,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            id: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function removeQuestById(id: string) {
    try {
        const [quest] = await database.delete(quests)
            .where(eq(quests.id, id))
            .returning();

        return {
            id: quest?.id,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            id: undefined,
            error: "An unexpected database error occurred",
        };
    }
}

export async function removeQuestByGameId(gameId: string) {
    try {
        const deletedQuests = await database.delete(quests)
            .where(eq(quests.game_id, gameId))
            .returning();

        return {
            count: deletedQuests.length,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            count: 0,
            error: "An unexpected database error occurred",
        };
    }
}

export async function removeQuestBySlug(organizationId: string, slug: string) {
    try {
        const [quest] = await database.delete(quests)
            .where(and(eq(quests.organization_id, organizationId), eq(quests.slug, slug)))
            .returning();

        return {
            id: quest?.id,
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            id: undefined,
            error: "An unexpected database error occurred",
        };
    }
}