import { database } from "@/database/db";
import { games, landmarks } from "@/database/schema";
import { and, eq, ilike } from "drizzle-orm";
import slugify from "slugify";

export async function searchLandmarks(organizationId: string, page: number, pageSize: number, title?: string, labels?: string[]) {
    try {

        const offset = page * pageSize;
        const limit = pageSize;

        const filters = [
            eq(landmarks.organization_id, organizationId),
        ];

        if (title && title.length > 0) {
            filters.push(ilike(landmarks.title, `%${title}%`));
        }

        let searchResults = await database.select()
            .from(landmarks)
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
            error: "An unexpected database error occured",
        }
    }
}

export async function getLandmarkById(id: string) {
try {
        const [landmark] = await database.select()
            .from(landmarks)
            .where(eq(landmarks.id, id));

        if (!landmark) {
            return {
                metadata: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            landmark: landmark,
        }

    } catch (error) {
        console.error("Internal database error:", error);

        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function getLandmarkBySlug(organizationId: string, slug: string) {
    try {
        const [landmark] = await database.select()
            .from(landmarks)
            .where(and(eq(landmarks.organization_id, organizationId), eq(landmarks.slug, slug)));

        if (!landmark) {
            return {
                metadata: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            landmark: landmark,
        }

    } catch (error) {
        console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function checkLandmarkSlug(organizationId: string, slug: string) {
    try {

        const [landmark] = await database.select()
            .from(landmarks)
            .where(and(eq(landmarks.organization_id, organizationId), eq(landmarks.slug, slug)));

        return !landmark; // return true if slug is not used by any landmark

    } catch(error) {
        console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function createLandmark(organizationId: string, title: string, description: string, longitude: number, latitude: number, slug?: string, labels?: string[], assets?: string[]) {
    try {

        if (!slug) slug = slugify(title, {
            lower: true,
            trim: true,
        });

        const [landmark] = await database.insert(landmarks)
            .values({
                slug,
                organization_id: organizationId,
                labels,
                title,
                description,
                assets,
                coords: { x: longitude, y: latitude }
            }).returning()
        
        return {
            id: landmark?.id,
        }
    } catch(error) {
        console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function updateLandmark(id: string, title?: string, description?: string) { 
    try {

        const [landmark] = await database.update(landmarks)
            .set({
                title,
                description,
            })
            .where(eq(landmarks.id, id))
            .returning();

        return {
            id: landmark?.id,
        }

    } catch(error) {
        console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function updateLandmarkAssets(id: string, assets: string[]) {
    try {

        const [landmark] = await database.update(landmarks)
            .set({
                assets,
            })
            .returning();
        
        return {
            id: landmark?.id,
        }

    } catch(error) {
        console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function updateLandmarkLabels(id: string, labels: string[]) {
    try {
        const [landmark] = await database.update(landmarks)
            .set({
                labels,
            })
            .returning();
        
        return {
            id: landmark?.id,
        }
    } catch(error) {
        console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function updateLandmarkLocation(id: string, longitude: number, latitude: number) { 
    try {
        const [landmark] = await database.update(landmarks)
            .set({
                coords: {
                    x: longitude, y: latitude,
                }
            })
            .returning();

        return {
            id: landmark?.id,
        }
    } catch(error) {
        console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function removeLandmarkById(id: string) { 
    try {

        const [ landmark ] = await database.delete(landmarks)
            .where(eq(landmarks.id, id))
            .returning();

        return {
            id: landmark?.id,
        }
        
    } catch(error) {
                console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function removeLandmarkBySlug(organizationId: string, slug: string) {
        try {

        const [ landmark ] = await database.delete(landmarks)
            .where(and(eq(landmarks.organization_id, organizationId), eq(landmarks.slug, slug)))
            .returning();

        return {
            id: landmark?.id,
        }
        
    } catch(error) {
                console.error("Internal database error:", error);
        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}
