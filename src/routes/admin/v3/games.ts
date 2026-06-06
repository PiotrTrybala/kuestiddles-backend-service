import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { createGame, getGameById, getGameBySlug, removeGameById, removeGameBySlug, searchGames, updateGameAssetsById, updateGameAssetsBySlug } from "@/repositories/v3/games";
import { UUID_PATTERN } from "@/globals";
import { requireOrganization } from "@/routes/middleware";
import { getQuestsByGameId } from "@/repositories/v3/quests";

export const gamesRouter = new Hono<AppEnv>();
gamesRouter.use("*", requireOrganization);


gamesRouter.get("/search", zValidator('query', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().optional(),
    labels: z.string()
        .optional()
        .transform((val) => val && val.trim() !== "" ? val.split(',') : undefined),
})), async (c) => {

    const organization = c.get("organization")!;
    const { page, pageSize, name, labels } = c.req.valid("query");

    const { games, error } = await searchGames(
        organization.id,
        page,
        pageSize,
        name,
        labels,
    );

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({
        games: games,
    });
});

gamesRouter.post("/", zValidator("json", z.object({
    name: z.string(),
    slug: z.string().optional(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();
    const { name, slug } = c.req.valid("json");

    const { game, error } = await createGame(organization.id, name, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        game: game,
    });
});

gamesRouter.get(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { game, error } = await getGameById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    const { quests, error: e } = await getQuestsByGameId(game!.id);
    if (e) {
        return c.json({
            message: e,
        }, 500);
    }

    return c.json({ game, gameQuests: quests, });
});

gamesRouter.get("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();
    const { slug } = c.req.valid("param");

    const { game, error } = await getGameBySlug(
        organization.id,
        slug,
    );
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(game);

});

gamesRouter.patch(`/:id{${UUID_PATTERN}}/assets`, zValidator("json", z.object({
    assets: z.string().array(),
})), zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");
    const { assets } = c.req.valid("json");

    const { game, error } = await updateGameAssetsById(id, assets);

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        game: game,
    });
});

gamesRouter.patch("/:slug/assets", zValidator("json", z.object({
    assets: z.string().array(),
})), zValidator("param", z.object({
    slug: z.uuid(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");
    const { assets } = c.req.valid("json");

    const { game, error } = await updateGameAssetsBySlug(organization.id, slug, assets);

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        game: game,
    });
});

gamesRouter.delete(`/:id{${UUID_PATTERN}}`, zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { deleted, error } = await removeGameById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        deleted,
    });
});

gamesRouter.delete("/:slug", zValidator("param", z.object({
    slug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { slug } = c.req.valid("param");

    const { deleted, error } = await removeGameBySlug(organization.id, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        deleted,
    });
});