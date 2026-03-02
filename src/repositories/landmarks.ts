
export type ListLandmarksParams = {
    page: number,
    pageSize: number,
    labels: string[],
    name: string,
}

export async function listLandmarks(organizationId: string, params: ListLandmarksParams) {

}

export async function getLandmark(id: string) {

}

export async function getRecentLandmarks(organizationId: string, memberId: string) {

}

export type CreateLandmarkParams = {
    name: string,
    labels: string[],
    thumbnail: string,
    assets: string[],
    coords: { x: number, y: number },
};

export async function createLandmark(organizationId: string, params: CreateLandmarkParams) {

}

export type UpdateLandmarkParams = {
    updates: {
        field: string,
        value: string,
    }[]
};

export async function updateLandmark(landmarkId: string, params: UpdateLandmarkParams) {

}

export async function deleteLandmark(landmarkId: string) {

}

export async function visitLandmark(landmarkId: string, userId: string) {
    
}