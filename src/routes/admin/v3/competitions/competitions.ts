import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { groupsRouter } from "./groups";
import { invitesRouter } from "./invites";
import { requireAuth } from "@/routes/middleware";

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.route("/:competitionId/groups", groupsRouter);
competitionsRouter.route("/:competitionId/invites", invitesRouter);

competitionsRouter.get("/search", requireAuth("admin"), async (c) => {

});

competitionsRouter.get("/:id", requireAuth("admin"), async (c) => {

});

competitionsRouter.get("/slug/:slug", requireAuth("admin"), async (c) => {

});

competitionsRouter.get("/:id/leaderboard", requireAuth("admin"), async (c) => {

});

competitionsRouter.patch("/:id", requireAuth("admin"), async (c) => {

});

competitionsRouter.delete("/:id", requireAuth("admin"), async (c) => {

});

competitionsRouter.delete("/slug/:slug", requireAuth("admin"), async (c) => {

});
