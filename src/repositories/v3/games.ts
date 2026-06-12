import { database } from "@/database/db";
import { games } from "@/database/schema";
import { and, eq, ilike } from "drizzle-orm";
import slugify from "slugify";
import { formatError, type RepositoryError } from "./v3";

type Game = typeof games.$inferSelect;

export async function searchGames(organizationId: string, page: number, pageSize: number, name?: string, labels?: string[]): Promise<{ games: Game[], error?: RepositoryError }> {

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
            error: formatError(error),
        }
    }

}

export async function checkGameSlug(organizationId: string, slug: string): Promise<{ open: boolean, error?: RepositoryError }> {
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
            error: formatError(error)
        }
    }
}

export async function getGameById(id: string): Promise<{ game?: Game, error?: RepositoryError }> {
    try {
        const [game] = await database.select()
            .from(games)
            .where(eq(games.id, id));

        if (!game) {
            return {
                game: undefined,
                error: { message: "Metadata has not been found", status: 404 }
            }
        }


        return {
            game: game,
        }

    } catch (error) {
        console.error("Error occured while retriving game:", error);
        return {
            game: undefined,
            error: formatError(error),
        }
    }
}

export async function getGameBySlug(organizationId: string, slug: string): Promise<{ game?: Game, error?: RepositoryError }> {
    try {
        const [game] = await database.select()
            .from(games)
            .where(and(eq(games.organization_id, organizationId), eq(games.slug, slug)));

        if (!game) {
            return {
                game: undefined,
                error: { message: "Metadata has not been found", status: 404 } 
            }
        }

        return {
            game: game,
        }

    } catch (error) {
        console.error("Error occured while retriving game by slug:", error);
        return {
            game: undefined,
            error: formatError(error),
        }
    }
}

export async function createGame(organizationId: string, name: string, slug?: string | null): Promise<{ game?: Game, error?: RepositoryError }> {
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
            error: formatError(error),
        }
    }
}

export async function updateGameAssetsById(id: string, assets: string[]): Promise<{ game?: Game, error?: RepositoryError }> {
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
            error: formatError(error),
        }
    }
}

export async function updateGameAssetsBySlug(organizationId: string, slug: string, assets: string[]): Promise<{ game?: Game, error?: RepositoryError }> {

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
            error: formatError(error),
        }
    }

}

export async function removeGameById(id: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
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
            error: formatError(error),
        }
    }
}

export async function removeGameBySlug(organizationId: string, slug: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
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
            error: formatError(error),
        }
    }
}