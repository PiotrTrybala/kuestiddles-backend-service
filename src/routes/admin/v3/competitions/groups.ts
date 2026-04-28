import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const groupsRouter = new Hono<AppEnv>();

groupsRouter.get("/search", async (c) => {

});

groupsRouter.get("/:id", async (c) => {

});

groupsRouter.get("/slug/:slug", async (c) => {

});

groupsRouter.get("/:id/users", async (c) => {

});

groupsRouter.post("/", async (c) => {

});

groupsRouter.delete("/:id", async (c) => {

});

groupsRouter.delete("/slug/:slug", async (c) => {

});