import { database } from "@/database/db";
import { competitions, groups, groupUsers, invites, leaderboard, groupSolves } from "@/database/schema";
import { quests } from "@/database/schema/games";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";


export async function generateGroupInvite(competitionId: string, groupId: string, expiresAt: Date) {
    try {
        const [invite] = await database.insert(invites)
            .values({
                competition_id: competitionId,
                group_id: groupId,
                expires_at: expiresAt,
            })
            .returning();

        return { id: invite?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            invite: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function acceptGroupInvite(competitionId: string, groupId: string, inviteId: string, id: string, username: string) {
    try {
        const [invite] = await database.select()
            .from(invites)
            .where(
                and(
                    eq(invites.id, inviteId),
                    eq(invites.competition_id, competitionId),
                    eq(invites.group_id, groupId),
                )
            );

        if (!invite) {
            return { error: "Invite has not been found" };
        }

        if (invite.expires_at < new Date()) {
            return { error: "Invite has expired" };
        }

        const [groupUser] = await database.insert(groupUsers)
            .values({
                id,
                group_id: groupId,
                username,
            })
            .returning();

        await database.update(groups)
            .set({ members: sql`${groups.members} + 1` })
            .where(eq(groups.id, groupId));

        return { id: groupUser?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            invite: undefined,
            error: "An unexpected database error occured",
        };
    } 
}

export async function getInviteById(id: string) {
    try {
        const [invite] = await database.select()
            .from(invites)
            .where(eq(invites.id, id));

        if (!invite) {
            return {
                invite: undefined,
                error: "Invite has not been found",
            };
        }

        return { invite };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            invite: undefined,
            error: "An unexpected database error occured",
        };
    }
}