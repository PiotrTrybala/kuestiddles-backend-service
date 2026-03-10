import { Hono } from "hono";
import { eq, ilike, arrayOverlaps, and } from "drizzle-orm";

import { type AppEnv } from "../../config/app";
import { quests } from "../../database/schema/games";
import { database } from "../../database/db";
import { createQuest, deleteQuest, getQuest, listQuests, updateQuest } from "../../repositories/quests";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { requireOrganization } from "./middleware";

export const questsRouter = new Hono<AppEnv>();

questsRouter.use("*", requireOrganization);

questsRouter.get("/list", async (c) => {

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
    // const offset = page * pageSize;
    // const limit = pageSize;

    // const conditions = [
    //     eq(quests.organization_name, organization.name)
    // ];

    // if (name && name.trim() !== "") {
    //     conditions.push(ilike(quests.title, `%${name}%`));
    // }

    // if (labels.length > 0) {
    //     conditions.push(arrayOverlaps(quests.labels, labels));
    // }

    // const result = await database.select()
    //     .from(quests)
    //     .where(conditions.length > 0 ? and(...conditions) : undefined)
    //     .offset(offset)
    //     .limit(limit);

    // return c.json({
    //     page: page,
    //     quests: result,
    // })
});

// TODO: Add better error handling
// TODO: Add input validation
// TODO: Improve code consistancy

questsRouter.get("/:id", async (c) => {

    const id = c.req.param("id");
    const { quest, error } = await getQuest(id);

    console.log('quest:', quest);

    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }
    return c.json(quest);

    // const id = c.req.param("id");

    // const result = await database.select().from(quests).where(eq(quests.id, id));
    // if (result.length === 0) return c.notFound();

    // const [quest] = result;

    // return c.json(quest);
});

// TODO: Add QuestCreate validation
type QuestCreate = {
    landmarkId: string,
    title: string,
    description: string,
    labels: string[],
    thumbnail?: string,
    assets?: string[],
    answers?: string[],
    points: number,
};

questsRouter.post("/", async (c) => {
    const organization = c.get("organization")!;
    const body = await c.req.json<QuestCreate>();
    const { error } = await createQuest(organization.id, body);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.body(null, 204);

    // const [quest] = await database.insert(quests).values({
    //     landmark_id: body.landmarkId,
    //     organization_name: organization.name,
    //     title: body.title,
    //     description: body.description,
    //     labels: body.labels,
    //     thumbnail: body.thumbnail ?? "",
    //     assets: body.assets ?? [] as string[],
    //     points: body.points,
    // }).returning();

    // return c.json({ id: quest?.id });
});

type QuestUpdate = {
    updates: {
        field: string,
        value: any,
    }[]
};

questsRouter.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<QuestUpdate>();

    if (!body.updates?.length) {
        return c.json({ message: "No updates provided" }, 400);
    }

    const { quest, error } = await updateQuest(id, body);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.json(quest);

    // const allowedFields = new Set([
    //     "title",
    //     "description",
    //     "labels",
    //     "thumbnail",
    //     "assets",
    //     "points",
    //     "landmark",
    // ]);

    // const updateData: any = {};

    // for (const update of body.updates) {

    //     if (!allowedFields.has(update.field)) {
    //         return c.json({ message: `Invalid field: ${update.field}` }, 400);
    //     }

    //     if (update.field === "points") {

    //         const points = update.value;
    //         if (typeof points !== "number") return c.json({ message: "Invalid points" }, 400);

    //         updateData.points = points;
    //         continue;
    //     }   

    //     updateData[update.field] = update.value;
    // }

    // if (Object.keys(body).length === 0) {
    //     return c.json({ message: "No updates found" }, 400);
    // }

    // const [updated] = await database.update(quests)
    //     .set(updateData)
    //     .where(and(eq(quests.id, id)))
    //     .returning();

    // if (!updated) return c.notFound();

    // return c.json(updated);
});

questsRouter.delete("/:id", async (c) => {
    const organization = c.get("organization")!;
    const id = c.req.param("id");

    const { error } = await deleteQuest(organization.id, id);
    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.body(null, 200);
    // await database.delete(quests).where(and(eq(quests.id, id), eq(quests.organization_name, organization.name)));
    // return c.json({ message: "Deleted quest" });
});