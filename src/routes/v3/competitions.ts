import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireCompetition } from "../middleware";
import { createUser, getCompetitionsQuests, getSouvenir, getUsers, solveGroupQuest } from "@/repositories/v3/competitions";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { acceptInvite } from "@/controllers/invites";
import { getLeaderboard } from "@/controllers/leaderboard";
import { signCompetitionToken } from "../utils";
import { handleValidationError } from "../admin/v3/v3";
import { acceptInvitation } from "@/controllers/invites2";

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.get("/quests", requireCompetition(), async (c) => {

    const competition = c.get("competition")!;

    console.log("competition:", competition);

    const { quests, error } = await getCompetitionsQuests(competition.competitionId);

    console.log("competitions quests: ", quests);

    if (error) {
        return c.json({
            message: error,
        })
    }

    return c.json(quests);
});

competitionsRouter.get("/users", requireCompetition(), async (c) => {

    const competition = c.get("competition")!;

    const { users, error } = await getUsers(competition.groupId);

    if (error) {
        return c.json({
            message: error,
        });
    }

    return c.json(users);

});

competitionsRouter.post("/quests/solve", requireCompetition(), zValidator("json", z.object({
    questId: z.uuid(),
    answers: z.array(z.string()),
}), handleValidationError), async (c) => {
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

competitionsRouter.get("/souvenir/:userId", requireCompetition(), zValidator("param", z.object({
    userId: z.uuid(),
}), handleValidationError), async (c) => {
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
    inviteToken: z.string(), // TODO: Add regex validation
    username: z.string(),
}), handleValidationError), async (c) => {

    const { inviteToken, username } = c.req.valid("json");

    const { accepted, error } = await acceptInvitation(inviteToken);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    
    if (!accepted) {
        return c.json({ message: "Failed to accept invite to competitions group" }, 400);
    }

    console.log("invitation token = ", inviteToken);

    const [ competitionId, invitationId, groupId ] = inviteToken.split(":");

    console.log("competitionId = ", competitionId, "invitationId = ", invitationId, "groupId = ", groupId);

    const { user, error: e } = await createUser(
        groupId!,
        username,
    );
    if (e) {
        return c.json({
            message: e,
        }, 500);
    }

    const competitionToken = signCompetitionToken(
        competitionId!,
        groupId!,
        username,
    )

    console.log(`Created new user (userId = ${user!.id}, groupId=${user!.group_id}, username=${user!.username})`);

    return c.json({ 
        created: true,
        competitionToken,
     });
});

competitionsRouter.get("/leaderboard", requireCompetition(), async (c) => {
    const competition = c.get("competition")!;

    const { leaderboard, error } = await getLeaderboard(competition.competitionId);
    if (error) {
        return c.json({
            message: error,
        }, 500);
    }

    return c.json({ leaderboard });
});

