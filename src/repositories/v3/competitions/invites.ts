import { database } from "@/database/db";
import { competitions, groups, groupUsers, invites } from "@/database/schema";
import { and, eq, sql } from "drizzle-orm";

type CompetitionInvite = typeof invites.$inferSelect;
type CompetitionUser = typeof groupUsers.$inferSelect;

export async function searchInvites(organizationId: string, page: number, pageSize: number): Promise<{ invites: CompetitionInvite[], error?: string }> {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

        const filters = [
            eq(competitions.organization_id, organizationId),
        ];


        const results = await database.select()
            .from(invites)
            .where(and(...filters))
            .limit(limit)
            .offset(offset);

        return { invites: results };
    } catch (error) {
        console.error("Error occured while retrieving invites:", error);
        return {
            invites: [],
            error: "An unexpected database error has occured",
        };
    }
}

export async function generateGroupInvite(competitionId: string, groupId: string, expiresAt: Date): Promise<{ invite?: CompetitionInvite, error?: string }> {
    try {
        const [invite] = await database.insert(invites)
            .values({
                competition_id: competitionId,
                group_id: groupId,
                expires_at: expiresAt,
            })
            .returning();

        return { invite: invite };
    } catch (error) {
        console.error("Error occured while generating new group invite:", error);
        return {
            invite: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function acceptGroupInvite(competitionId: string, groupId: string, inviteId: string, username: string): Promise<{ user?: CompetitionUser, error?: string }> {
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
                group_id: groupId,
                username,
            })
            .returning();

        await database.update(groups)
            .set({ members: sql`${groups.members} + 1` })
            .where(eq(groups.id, groupId));

        return { user: groupUser };
    } catch (error) {
        console.error("Error occured while accepting competition group invite:", error);
        return {
            user: undefined,
            error: "An unexpected database error has occured",
        };
    } 
}

export async function getInviteById(id: string): Promise<{ invite?: CompetitionInvite, error?: string }> {
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
        console.error("Error occured while retrieving invite:", error);
        return {
            invite: undefined,
            error: "An unexpected database error has occured",
        };
    }
}

export async function deleteInvite(competitionId: string, id: string): Promise<{ deleted: boolean, error?: string }> {
      try {
        const [competition] = await database.delete(invites)
            .where(and(eq(invites.id, id), eq(invites.competition_id, competitionId)))
            .returning();

        return { deleted: true };
    } catch (error) {
        console.error("Error occured while deleting invite:", error);
        return {
            deleted: false,
            error: "An unexpected database error has occured",
        };
    }  
}