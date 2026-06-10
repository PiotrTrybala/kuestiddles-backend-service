import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireCompetition } from "../middleware";
import { createUser, getCompetitionsQuests, getSouvenir, solveGroupQuest } from "@/repositories/v3/competitions";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { acceptInvite } from "@/controllers/invites";
import { getLeaderboard } from "@/controllers/leaderboard";

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

    return c.json(quests);
});

competitionsRouter.post("/quests/solve", zValidator("json", z.object({
    questId: z.uuid(),
    answers: z.array(z.string()),
})), async (c) => {
    const competition = c.get("competition")!;
    const { questId, answers } = c.req.valid("json"); 
    
    const { solved, error } = await solveGroupQuest(
        competition.competitionId,
        competition.groupId,
        questId,
        answers,
    );

    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({
        solved,
    });
});

competitionsRouter.get("/souvenir/:userId", zValidator("param", z.object({
    userId: z.uuid(),
})), async (c) => {
    const competition = c.get("competition")!;
    const { userId } = c.req.valid("param");

    const { souvenir, error } = await getSouvenir(
        competition.competitionId, 
        competition.groupId, 
        userId
    );
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json(souvenir);
});

competitionsRouter.post("/invites/accept", zValidator("json", z.object({
    inviteId: z.uuid(),
    username: z.string(),
})), async (c) => {
    const competition = c.get("competition")!;
    const { inviteId, username } = c.req.valid("json");

    const { accepted, error } = await acceptInvite(
        competition.competitionId,
        inviteId,
    );
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    if (!accepted) {
        return c.json({ message: "Failed to accept invite to competitions group" }, 400);
    }

    const { user, error: e } = await createUser(
        competition.groupId,
        username,
    );
    if (e) {
        return c.json({
            message: e,
        }, 500);
    }

    console.log(`Created new user (userId = ${user!.id}, groupId=${user!.group_id}, username=${user!.username})`);

    return c.json({ created: true });
});

competitionsRouter.get("/leaderboard", async (c) => {
    const competition = c.get("competition")!;

    const { leaderboard, error } = await getLeaderboard(competition.competitionId);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({ leaderboard });
});

