import { database } from "@/database/db";
import { games } from "@/database/schema";
import { and, eq, ilike } from "drizzle-orm";
import slugify from "slugify";

type Game = typeof games.$inferSelect;

export async function searchGames(organizationId: string, page: number, pageSize: number, name?: string, labels?: string[]): Promise<{ games: Game[], error?: string }> {

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
            games: searchResults,
        };

    } catch (error) {
        console.error("Error occured while retriving games:", error);
        return {
            games: [],
            error: "An unexpected database error has occured",
        }
    }

}

export async function checkGameSlug(organizationId: string, slug: string): Promise<{ open: boolean }> {
    try {
        const [game] = await database.select()
            .from(games)
            .where(and(eq(games.organization_id, organizationId), eq(games.slug, slug)));

        return {
            open: true,
        }; // return true if slug is not used by any game
    } catch(error) {
        console.error("Error while checking game slug:", error);
        return {
            open: false,
        }
    }
}

export async function getGameById(id: string): Promise<{ game?: Game, error?: string }> {
    try {
        const [game] = await database.select()
            .from(games)
            .where(eq(games.id, id));

        if (!game) {
            return {
                game: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            game: game,
        }

    } catch (error) {
        console.error("Error occured while retriving game:", error);
        return {
            game: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function getGameBySlug(organizationId: string, slug: string): Promise<{ game?: Game, error?: string }> {
    try {
        const [game] = await database.select()
            .from(games)
            .where(and(eq(games.organization_id, organizationId), eq(games.slug, slug)));

        if (!game) {
            return {
                game: undefined,
                error: "Metadata has not been found"
            }
        }

        return {
            game: game,
        }

    } catch (error) {
        console.error("Error occured while retriving game by slug:", error);
        return {
            game: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function createGame(organizationId: string, name: string, slug?: string | null): Promise<{ game?: Game, error?: string }> {
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
            game: game,
        }
    } catch (error) {
        console.error("Error occured while creating new game:", error);
        return {
            game: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function updateGameAssetsById(id: string, assets: string[]): Promise<{ game?: Game, error?: string }> {
    try {
        const [ game ] = await database.update(games)
            .set({
                assets,
            })
            .where(eq(games.id, id)).returning();
        
        return {
            game: game,
        }
    } catch(error) {
        console.error("Error occured while updating games assets:", error);
        return {
            game: undefined,
            error: "An unexpected database error has occured",
        }
    }
}

export async function updateGameAssetsBySlug(organizationId: string, slug: string, assets: string[]): Promise<{ game?: Game, error?: string }> {

    try {
        const [ game ] = await database.update(games)
            .set({
                assets,
            })
            .where(and(eq(games.organization_id, organizationId), eq(games.slug, slug)))
            .returning();
        
        return {
            game: game,
        }
    } catch(error) {
        console.error("Error occured while updating games assets by slug:", error);
        return {
            game: undefined,
            error: "An unexpected database error has occured",
        }
    }

}

export async function removeGameById(id: string): Promise<{ deleted: boolean, error?: string}> {
    try {
        const [ game ] = await database.delete(games)
            .where(eq(games.id, id))
            .returning();

        return {
            deleted: true, 
        }
    } catch(error) {
        console.error("Error occured while deleting game:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        }
    }
}

export async function removeGameBySlug(organizationId: string, slug: string): Promise<{ deleted: boolean, error?: string}> {
try {
        const [ game ] = await database.delete(games)
            .where(and(eq(games.organization_id, organizationId), eq(games.slug, slug)))
            .returning();

        return {
            deleted: true,
        }
    } catch(error) {
        console.error("Error occured while deleting game by slug:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        }
    }
}