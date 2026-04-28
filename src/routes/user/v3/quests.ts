import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const questsRouter = new Hono<AppEnv>();

questsRouter.get("/search", async (c) => {

});

questsRouter.get("/:id", async (c) => {

});

questsRouter.get("/solve", async (c) => {

});