import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireCompetition } from "../middleware";
import { getCompetitionsQuests } from "@/repositories/v3/competitions";

export const competitionsRouter = new Hono<AppEnv>();
competitionsRouter.use("*", requireCompetition());

competitionsRouter.get("/quests", async (c) => {

    const competition = c.get("competition")!;

    const { quests, error } = await getCompetitionsQuests(competition.competitionId);
    if (error) {
        return c.json({
            message: error,
        })
    }

});

competitionsRouter.post("/quests/solve", async (c) => {});

competitionsRouter.get("/souvenir", async (c) => {});

competitionsRouter.post("/invites/accept", async (c) => {});

// competitionsRouter.get("/quests", async (c) => {

//     const competition = c.get("competition");
//     if (!competition) return c.json({ message: "Forbidden" }, 403);
//     return c.json({}, 200);
//     // const { quests, error } = await getCompetitionQuests(competition.competitionId);
//     // if (error) {
//     //     return c.json({
//     //         message: error,
//     //     }, 500);
//     // }
//     // return c.json({
//     //     quests,
//     // }, 200);
// });

// competitionsRouter.get("/groups/current", async (c) => {

//     const competition = c.get("competition");
//     if (!competition) return c.json({ message: "Forbidden" }, 403);
//     return c.json({}, 200);
//     // const { group, error } = await getUserGroup(competition.competitionId, competition.groupId);

//     // if (error) {
//     //     return c.json({
//     //         message: error,
//     //     }, 500);
//     // }

//     // return c.json({
//     //     group,
//     // })
// });

// competitionsRouter.post("/invites/accept", async (c) => {
//     const { competitionId, groupId, inviteId } = c.req.query();
//     const { username } = await c.req.json();
//     return c.json({}, 200);
//     // const { user, error } = await acceptGroupInvite(competitionId!, groupId!, inviteId!, username);
//     // if (error) {
//     //     return c.json({
//     //         message: error,
//     //     }, 200);
//     // }

//     // return c.json({
//     //     user,
//     // }, 200);
// });

// competitionsRouter.post("/quests/solve", async (c) => {

//     const competition = c.get("competition");
//     if (!competition) return c.json({ message: "Forbidden" }, 403);


//     return c.json({}, 200);
// });

// competitionsRouter.get("/leaderboard", async (c) => {

//     const competition = c.get("competition");
//     if (!competition) return c.json({ message: "Forbidden" }, 403);
//     return c.json({}, 200);
// });

// competitionsRouter.get("/souvenir", async (c) => {

//     const competition = c.get("competition");
//     if (!competition) return c.json({ message: "Forbidden" }, 403);



//     return c.json({}, 200);
// });

