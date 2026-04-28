import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { groupsRouter } from "./groups";
import { invitesRouter } from "./invites";

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.route("/:competitionId/groups", groupsRouter);
competitionsRouter.route("/:competitionId/invites", invitesRouter);

competitionsRouter.get("/search", async (c) => {

});

competitionsRouter.get("/:id", async (c) => {

});

competitionsRouter.get("/slug/:slug", async (c) => {

});

competitionsRouter.get("/:id/leaderboard", async (c) => {

});

competitionsRouter.patch("/:id", async (c) => {

});

competitionsRouter.delete("/:id", async (c) => {

});

competitionsRouter.delete("/slug/:slug", async (c) => {

});
