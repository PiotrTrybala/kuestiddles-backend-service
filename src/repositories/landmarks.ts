import { eq, ilike, arrayOverlaps, and } from "drizzle-orm";
import { landmarks } from "../database/schema/games";
import { database } from "../database/db";

export type Error = {
    code: number;
    error: string;
};

type Landmark = typeof landmarks.$inferSelect;

export type ListLandmarksParams = {
    page: number;
    pageSize: number;
    labels: string[];
    name: string;
};

export async function listLandmarks(organizationId: string, { page, pageSize, name, labels }: ListLandmarksParams): Promise<{ landmarks: Landmark[] }> {
    const offset = page * pageSize;
    const limit = pageSize;

    const conditions = [
        eq(landmarks.organization_id, organizationId)
    ];

    if (name && name.trim() !== "") {
        conditions.push(ilike(landmarks.name, `%${name}%`));
    }

    if (labels && labels.length > 0) {
        conditions.push(arrayOverlaps(landmarks.labels, labels));
    }

    const result = await database.select()
        .from(landmarks)
        .where(and(...conditions))
        .offset(offset)
        .limit(limit);

    return {
        landmarks: result,
    };
}

export async function getLandmark(id: string): Promise<{ landmark?: Landmark, error?: Error }> {
    try {
        const result = await database.select().from(landmarks).where(eq(landmarks.id, id));
        
        if (result.length === 0) {
            return { error: { code: 404, error: "Landmark not found" } };
        }

        return { landmark: result[0] };
    } catch (error) {
        console.error('Error fetching landmark:', error);
        return { error: { code: 500, error: "Internal error while retrieving landmark" } };
    }
}

export async function getRecentLandmarks(organizationId: string, memberId: string): Promise<{ landmarks: Landmark[], error?: Error }> {

    


    return { 
        landmarks: [],
        error: { code: 501, error: "Not implemented" },
    }
}

export type CreateLandmarkParams = {
    name: string,
    description: string,
    labels: string[],
    thumbnail: string | null,
    assets: string[],
    position: {
        longitude: number,
        latitude: number,
    },
};

export async function createLandmark(organizationId: string, params: CreateLandmarkParams): Promise<{ landmark?: Landmark, error?: Error }> {
    try {
        const [landmark] = await database.insert(landmarks).values({
            organization_id: organizationId,
            name: params.name,
            description: params.description,
            labels: params.labels,
            thumbnail: params.thumbnail ?? "",
            assets: params.assets,
            coords: {
                x: params.position.longitude,
                y: params.position.latitude,
            },
        }).returning();

        if (!landmark) {
            return { error: { code: 400, error: "Failed to create landmark" } };
        }

        return { landmark };
    } catch (error) {
        console.error('Error creating landmark:', error);
        return { error: { code: 500, error: "Internal error while creating landmark" } };
    }
}

export type UpdateLandmarkParams = {
    updates: {
        field: string;
        value: any;
    }[]
};

const ALLOWED_LANDMARK_FIELDS = new Set([
    "name",
    "description",
    "labels",
    "thumbnail",
    "assets",
    "coords"
]);

export async function updateLandmark(landmarkId: string, params: UpdateLandmarkParams): Promise<{ landmark?: Landmark, error?: Error }> {

    console.log('landmark id:', landmarkId, 'params:', params);

    try {
        const updateData: any = {};

        for (const update of params.updates) {
            if (!ALLOWED_LANDMARK_FIELDS.has(update.field)) {
                return { error: { code: 400, error: `Field ${update.field} is not allowed` } };
            }
            updateData[update.field] = update.value;
        }

        if (Object.keys(updateData).length === 0) {
            return { error: { code: 400, error: "No valid updates provided" } };
        }

        const [updated] = await database.update(landmarks)
            .set(updateData)
            .where(eq(landmarks.id, landmarkId))
            .returning();

        if (!updated) return { error: { code: 404, error: "Landmark not found" } };

        return { landmark: updated };
    } catch (error) {
        console.error('Error updating landmark:', error);
        return { error: { code: 500, error: "Internal error while updating landmark" } };
    }
}

export async function deleteLandmark(landmarkId: string): Promise<{ error?: Error }> {
    try {
        const result = await database.delete(landmarks)
            .where(eq(landmarks.id, landmarkId))
            .returning();
        
        if (result.length === 0) {
            return { error: { code: 404, error: "Landmark not found for deletion" } };
        }

        return {};
    } catch (error) {
        console.error('Error deleting landmark:', error);
        return { error: { code: 500, error: "Internal error while deleting landmark" } };
    }
}

export async function visitLandmark(landmarkId: string, userId: string) {
    console.log(`User ${userId} visited landmark ${landmarkId}`);
    return { success: true };
}