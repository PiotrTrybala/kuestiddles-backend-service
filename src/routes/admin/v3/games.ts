import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { createGame, getGameById, getGameBySlug, removeGameById, removeGameBySlug, searchGames, updateGameAssetsById, updateGameAssetsBySlug } from "@/repositories/v3/games";

export const gamesRouter = new Hono<AppEnv>();

gamesRouter.get("/search", zValidator('param', z.object({
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(20),
    name: z.string().default(""),
    labels: z.string().transform((value) => value.split(',')).default([]),
})), async (c) => {

    const organization = c.get("organization")!;
    const { page, pageSize, name, labels } = c.req.valid("param");

    const { results, error } = await searchGames(
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
        results,
    });
});

gamesRouter.get("/:id", zValidator("param", z.object({
    id: z.uuid(),
})), async (c) => {
    const { id } = c.req.valid("param");

    const { metadata, error } = await getGameById(id);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(metadata);
});

gamesRouter.get("/:gameSlug", zValidator("param", z.object({
    gameSlug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();
    const { gameSlug } = c.req.valid("param");

    const { metadata, error } = await getGameBySlug(
        organization.id,
        gameSlug,
    );
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(metadata);

});

gamesRouter.post("/", zValidator("json", z.object({
    name: z.string(),
    slug: z.string().nullish(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();
    const { name, slug } = c.req.valid("json");

    const { id, error } = await createGame(organization.id, name, slug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        id: id,
    });
});

gamesRouter.patch("/:gameId/assets", zValidator("json", z.object({
    assets: z.string().array(),
})), zValidator("param", z.object({
    gameId: z.uuid(),
})), async (c) => {
    const { gameId } = c.req.valid("param");
    const { assets } = c.req.valid("json");

    const { id, error } = await updateGameAssetsById(gameId, assets);

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        id: id,
    });
});

gamesRouter.patch("/:gameSlug/assets", zValidator("json", z.object({
    assets: z.string().array(),
})), zValidator("param", z.object({
    gameSlug: z.uuid(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { gameSlug } = c.req.valid("param");
    const { assets } = c.req.valid("json");

    const { id, error } = await updateGameAssetsBySlug(organization.id, gameSlug, assets);

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        id: id,
    });
});

gamesRouter.delete("/:gameId", zValidator("param", z.object({
    gameId: z.uuid(),
})), async (c) => {
    const { gameId } = c.req.valid("param");

    const { id, error } = await removeGameById(gameId);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        id: id,
    });
});

gamesRouter.delete("/:gameSlug", zValidator("param", z.object({
    gameSlug: z.string(),
})), async (c) => {
    const organization = c.get("organization");
    if (!organization) return c.notFound();

    const { gameSlug } = c.req.valid("param");

    const { id, error } = await removeGameBySlug(organization.id, gameSlug);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }
    return c.json({
        id: id,
    });
});