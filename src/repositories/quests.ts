import { arrayOverlaps, eq, ilike, and } from "drizzle-orm";
import { quests } from "../database/schema/organizations";
import { organization } from "../database/schema/auth";
import { database } from "../database/db";

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
        eq(quests.organization_id, organization.id)
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

export async function getQuest(id: string): Promise<{ quest?: Quest, error?: string }> {

    const quest = await database.query.quests.findFirst({
        where: eq(quests.id, id)
    });

    if (!quest) {
        return { error: "Quest not found" };
    }

    return { quest }
}

export async function getRecentQuests(organizationId: string, memberId: string) { }

export type CreateQuestParams = {
    landmarkId: string,
    title: string,
    description: string,
    labels: string[],
    thumbnail: string,
    assets: string[],
    points: number,
};

export async function createQuest(organizationId: string, params: CreateQuestParams) { }

export type UpdateQuestParams = {
    updates: {
        field: string,
        value: string,
    }[]
};

export async function updateQuest(organizationId: string, params: UpdateQuestParams) {

}

export async function deleteQuest(id: string) {

}

export async function solveQuest(questId: string, userId: string, answers: string[]) {

}