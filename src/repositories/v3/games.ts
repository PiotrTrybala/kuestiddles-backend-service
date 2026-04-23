import { database } from "@/database/db";
import { games } from "@/database/schema";
import { and, eq, ilike } from "drizzle-orm";
import slugify from "slugify";


export async function searchGames(organizationId: string, page: number, pageSize: number, name?: string, labels?: string[]) {

    try {

        const offset = page * pageSize;
        const limit = pageSize;


        const filters = [
            eq(games.organization_id, organizationId),
        ];

        if (name && name.length > 0) {
            filters.push(ilike(games.name, `%${name}%`));
        }

        let searchResults = await database.select()
            .from(games)
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

export async function getGameById(id: string) {
    try {
        const [game] = await database.select()
            .from(games)
            .where(eq(games.id, id));

        if (!game) {
            return {
                metadata: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            game: game,
        }

    } catch (error) {
        console.error("Internal database error:", error);

        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function getGameBySlug(organizationId: string, slug: string) {
    try {
        const [game] = await database.select()
            .from(games)
            .where(and(eq(games.organization_id, organizationId), eq(games.slug, slug)));

        if (!game) {
            return {
                metadata: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            game: game,
        }

    } catch (error) {
        console.error("Internal database error:", error);

        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }
    }
}

export async function createGame(organizationId: string, name: string, slug?: string) {
    try {

        if (!slug) slug = slugify(name, {
            lower: true,
            trim: true,
        });

        const [game] = await database.insert(games)
            .values({
                organization_id: organizationId,
                slug,
                name,
            }).returning();
        
        return {
            id: game?.id,
        }
    } catch (error) {
        console.error("Internal database error:", error);

        return {
            metadata: undefined,
            error: "An unexpected database error occured",
        }

    }
}

export async function updateGameAssetsById(id: string, assets: string[]) {
    try {
        const [ game ] = await database.update(games)
            .set({
                assets,
            })
            .where(eq(games.id, id)).returning();
        
        return {
            id: game?.id,
        }
    } catch(error) {
        console.error("Internal database error:", error);

        return {
            error: "An unexpected database error occured",
        }
    }
}

export async function updateGameAssetsBySlug(organizationId: string, slug: string, assets: string[]) {

}

export async function removeGameById(id: string) {
    try {
        const [ game ] = await database.delete(games)
            .where(eq(games.id, id))
            .returning();

        return {
            id: game?.id,
        }
    } catch(error) {
        console.error("Internal database error:", error);

        return {
            error: "An unexpected database error occured",
        }
    }
}

export async function removeGameBySlug(organizationId: string, slug: string) {

}