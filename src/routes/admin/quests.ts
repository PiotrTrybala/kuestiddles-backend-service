import { Hono } from "hono";
import { type AppEnv } from "../../config/app";
import { quests } from "../../database/schema/kuestiddles";
import { requireAdmin } from "./middleware";

export const questsRouter = new Hono<AppEnv>();

questsRouter.get("/list", requireAdmin, async (c) => {

});

questsRouter.get("/:id", requireAdmin, async (c) => {

});

questsRouter.post("/", requireAdmin, async (c) => {

});

questsRouter.patch("/:id", requireAdmin, async (c) => {

});

questsRouter.delete("/:id", requireAdmin, async (c) => {

});