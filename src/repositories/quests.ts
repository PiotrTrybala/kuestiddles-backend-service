
export type ListQuestsParams = {

};

export async function listQuests(organizationId: string, params: ListQuestsParams) {

}

export async function getQuest(id: string) {

}

export async function getRecentQuests(organizationId: string, memberId: string) {}

export type CreateQuestParams = {
    landmarkId: string,
    title: string,
    description: string,
    labels: string[],
    thumbnail: string,
    assets: string[],
    points: number,
};

export async function createQuest(organizationId: string, params: CreateQuestParams) {}

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