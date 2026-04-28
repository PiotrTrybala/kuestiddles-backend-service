import type { AppEnv } from "@/config/app";
import { requireAuth } from "@/routes/middleware";
import { Hono } from "hono";

export const invitesRouter = new Hono<AppEnv>();

invitesRouter.use("*", requireAuth("admin"));

invitesRouter.get("/search", async (c) => {

});

invitesRouter.post("/", async (c) => {

});

invitesRouter.delete("/:id", async (c) => {

});