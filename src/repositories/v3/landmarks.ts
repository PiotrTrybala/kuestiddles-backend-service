import { database } from "@/database/db";
import { games, landmarks } from "@/database/schema";
import { and, eq, ilike } from "drizzle-orm";
import slugify from "slugify";

type Landmark = typeof landmarks.$inferSelect;

export async function searchLandmarks(organizationId: string, page: number, pageSize: number, title?: string, labels?: string[]): Promise<{ landmarks: Landmark[], error?: string }> {
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
            landmarks: searchResults,
        };

    } catch (error) {
        console.error("Error occured while retriving organizations landmarks:", error);
        return {
            landmarks: [],
            error: "An unexpected database error has occured",
        }
    }
}

export async function getLandmarkById(id: string): Promise<{ landmark?: Landmark, error?: string }> {
try {
        const [landmark] = await database.select()
            .from(landmarks)
            .where(eq(landmarks.id, id));

        if (!landmark) {
            return {
                landmark: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            landmark: landmark,
        }

    } catch (error) {
        console.error("Error occured while retriving landmark by id:", error);

        return {
            landmark: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function getLandmarkBySlug(organizationId: string, slug: string): Promise<{ landmark?: Landmark, error?: string }> {
    try {
        const [landmark] = await database.select()
            .from(landmarks)
            .where(and(eq(landmarks.organization_id, organizationId), eq(landmarks.slug, slug)));

        if (!landmark) {
            return {
                landmark: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            landmark: landmark,
        }

    } catch (error) {
        console.error("Error occured while retriving landmark by slug:", error);

        return {
            landmark: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function checkLandmarkSlug(organizationId: string, slug: string): Promise<{ open: boolean }> {
    try {

        const [landmark] = await database.select()
            .from(landmarks)
            .where(and(eq(landmarks.organization_id, organizationId), eq(landmarks.slug, slug)));

        return {
            open: !landmark
        };

    } catch(error) {
        console.error("Error occured while checking landmark slug:", error);
        return {
            open: false,
        }
    }
}

export async function createLandmark(
    organizationId: string, 
    title: string,
    description: string, 
    longitude: number, 
    latitude: number, 
    slug?: string, 
    labels?: string[], 
    assets?: string[]
): Promise<{ landmark?: Landmark, error?: string }> {
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
            landmark: landmark,
        }
    } catch(error) {
        console.error("Error occured while creating landmark:", error);
        return {
            landmark: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function updateLandmark(id: string, title?: string, description?: string): Promise<{ landmark?: Landmark, error?: string }> { 
    try {

        const updateBody: Partial<typeof landmarks.$inferInsert> = {};
        if (title !== undefined) updateBody.title = title;
        if (description !== undefined) updateBody.description = description;

        if (Object.keys(updateBody).length === 0) {
            return {
                error: "No update parameters provided"
            };
        }

        const [landmark] = await database.update(landmarks)
            .set({
                title,
                description,
            })
            .where(eq(landmarks.id, id))
            .returning();

        return {
            landmark: landmark,
        }

    } catch(error) {
        console.error("Error occured while updating landmark:", error);
        return {
            landmark: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function updateLandmarkAssets(id: string, assets: string[]): Promise<{ landmark?: Landmark, error?: string }> {
    try {

        const [landmark] = await database.update(landmarks)
            .set({
                assets,
            })
            .returning();
        
        return {
            landmark: landmark,
        }

    } catch(error) {
        console.error("Error occured while updating landmarks assets:", error);
        return {
            landmark: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function updateLandmarkLabels(id: string, labels: string[]): Promise<{ landmark?: Landmark, error?: string }> {
    try {
        const [landmark] = await database.update(landmarks)
            .set({
                labels,
            })
            .returning();
        
        return {
            landmark,
        }
    } catch(error) {
        console.error("Error occured while updating landmarks labels:", error);
        return {
            landmark: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function updateLandmarkLocation(id: string, longitude: number, latitude: number): Promise<{ landmark?: Landmark, error?: string }> { 
    try {
        const [landmark] = await database.update(landmarks)
            .set({
                coords: {
                    x: longitude, y: latitude,
                }
            })
            .where(eq(landmarks.id, id))
            .returning();

        return {
            landmark,
        }
    } catch(error) {
        console.error("Error occured while updating landmarks location:", error);
        return {
            landmark: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function removeLandmarkById(id: string): Promise<{ deleted: boolean, error?: string }> { 
    try {

        const [ landmark ] = await database.delete(landmarks)
            .where(eq(landmarks.id, id))
            .returning();

        return {
            deleted: true,
        }
        
    } catch(error) {
        console.error("Error occured while deleting landmark by id:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        }
    }
}

export async function removeLandmarkBySlug(organizationId: string, slug: string): Promise<{ deleted: boolean, error?: string }> {
        try {

        const [ landmark ] = await database.delete(landmarks)
            .where(and(eq(landmarks.organization_id, organizationId), eq(landmarks.slug, slug)))
            .returning();

        return {
            deleted: true,
        }
        
    } catch(error) {
        console.error("Error occured while deleting landmark by slug:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        }
    }
}
