import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireCompetition } from "../middleware";

export const competitionsRouter = new Hono<AppEnv>();
competitionsRouter.use("*", requireCompetition());

competitionsRouter.get("/groups/current", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);



});

competitionsRouter.get("/invites/accept", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);


});

competitionsRouter.post("/quests/solve", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);



});

competitionsRouter.get("/leaderboard", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);



});

competitionsRouter.get("/souvenir", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);



    
});

