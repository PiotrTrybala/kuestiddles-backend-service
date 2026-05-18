import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { requireCompetition } from "../middleware";
import { getGroupById, getGroupUsers, solveQuest } from "@/repositories/v3/competitions/groups";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { acceptGroupInvite, getInviteById } from "@/repositories/v3/competitions/invites";

export const competitionsRouter = new Hono<AppEnv>();

competitionsRouter.use("*", requireCompetition());

competitionsRouter.get("/groups/current", async (c) => {

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Bad request" }, 400);

    const { group, error } = await getGroupById(competition.groupId);
    if (error) {
        return c.json({ message: error }, 500);
    }

    const { users, error: e } = await getGroupUsers(competition.groupId);
    if (e) return c.json({ message: e }, 500);

    return c.json({ ...group, users: users });
});

type GroupSolvePayload = {
    questId: string,
    answers: string[],
};

competitionsRouter.post("/groups/solve", async (c) => {

    const { questId, answers } = await c.req.json<GroupSolvePayload>();

    const competition = c.get("competition");
    if (!competition) return c.json({ message: "Bad request" }, 400);

    const { success, error } = await solveQuest(competition.groupId, questId, answers);
    if (error) return c.json({ message: error }, 500);

    return c.json({ success }, 200);
});

competitionsRouter.post("/groups/accept", zValidator("query", z.object({
    inviteId: z.string(),
})), zValidator("json", z.object({
    username: z.string(),
})), async (c) => {

    const { inviteId } = c.req.valid("query");
    const { username } = c.req.valid("json");

    const { invite, error: e } = await getInviteById(inviteId);
    if (e || !invite) return c.json({ message: e }, 500);

    const { id, error} = await acceptGroupInvite(invite.competition_id, invite.group_id, inviteId, username);
    if (error) return c.json({ message: error }, 500);

    return c.json({
        message: id,
    }, 200); 
});