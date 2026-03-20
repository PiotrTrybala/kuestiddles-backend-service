import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { requireOrganization } from "../admin/middleware";

export const questsRouter = new Hono<AppEnv>();

questsRouter.use("*", requireOrganization);

export type QuestsSolveData = {

}

questsRouter.post("/solve", async (c) => {
    c.status(200);
});

questsRouter.get("/search", async (c) => {

});

questsRouter.get("/:id", async (c) => {

});