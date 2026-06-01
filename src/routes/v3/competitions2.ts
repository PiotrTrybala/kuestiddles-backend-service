import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireCompetition } from "../middleware";
import { getCompetitionQuests, getLeaderboard, getUserGroup } from "@/repositories/v3/competitions/users";
import { database } from "@/database/db";
import { groups } from "@/database/schema";
import { eq } from "drizzle-orm";
import { acceptGroupInvite } from "@/repositories/v3/competitions/invites";

export const competitionsRouter = new Hono<AppEnv>();
competitionsRouter.use("*", requireCompetition());

competitionsRouter.get("/quests", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);
    return c.json({}, 200);
    // const { quests, error } = await getCompetitionQuests(competition.competitionId);
    // if (error) {
    //     return c.json({
    //         message: error,
    //     }, 500);
    // }
    // return c.json({
    //     quests,
    // }, 200);
});

competitionsRouter.get("/groups/current", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);
    return c.json({}, 200);
    // const { group, error } = await getUserGroup(competition.competitionId, competition.groupId);

    // if (error) {
    //     return c.json({
    //         message: error,
    //     }, 500);
    // }

    // return c.json({
    //     group,
    // })
});

competitionsRouter.post("/invites/accept", async (c) => {
    const { competitionId, groupId, inviteId } = c.req.query();
    const { username } = await c.req.json();
    return c.json({}, 200);
    // const { user, error } = await acceptGroupInvite(competitionId!, groupId!, inviteId!, username);
    // if (error) {
    //     return c.json({
    //         message: error,
    //     }, 200);
    // }

    // return c.json({
    //     user,
    // }, 200);
});

competitionsRouter.post("/quests/solve", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);


    return c.json({}, 200);
});

competitionsRouter.get("/leaderboard", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);
    return c.json({}, 200);
});

competitionsRouter.get("/souvenir", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Forbidden" }, 403);



    return c.json({}, 200);
});

