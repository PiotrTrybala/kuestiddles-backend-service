import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { requireOrganization } from "../admin/middleware";
import { getQuest, listQuests, solveQuest } from "../../repositories/quests";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const questsRouter = new Hono<AppEnv>();

questsRouter.use("*", requireOrganization);

questsRouter.get("/search", async (c) => {

    const organization = c.get("organization")!;

    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);
    const labels = (c.req.query("labels") || "")
        .split(",")
        .map(l => l.trim())
        .filter(Boolean);

    const title = c.req.query("title") || "";

    const { quests } = await listQuests(organization.id, { page, pageSize, labels, title });

    return c.json({
        page: page,
        quests,
    });
});

questsRouter.get("/:id", async (c) => {
    const organization = c.get("organization")!;
    const user = c.get("user")!;
    const id = c.req.param("id");
    const { quest, error } = await getQuest(id);

    console.log('quest:', quest);

    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }
    return c.json(quest);
});

export type QuestsSolveData = {
    questId: string,
    answers: string[],
};

questsRouter.post("/solve", async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json<QuestsSolveData>();
    c.status(200);

    const { error} = await solveQuest(
        body.questId, 
        user.id, 
        body.answers,
    );

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    console.log(`User ${user.id} solved quest ${body.questId}`);

    return c.body(null, 200);
});

