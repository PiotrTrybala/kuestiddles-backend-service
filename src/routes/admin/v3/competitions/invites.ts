import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const invitesRouter = new Hono<AppEnv>();

invitesRouter.get("/search", async (c) => {

});

invitesRouter.post("/", async (c) => {

});

invitesRouter.delete("/:id", async (c) => {

});