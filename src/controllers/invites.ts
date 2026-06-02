import { redis } from "@/config/redis";

type Invite = {
    competitionId: string,
    groupId: string,
    expiresAt: Date,
};

type CreateInvite = {
    competitionId: string,
    groupId: string,
    expiresIn: number,
};

export const COMPETITION_INVITE_EXPIRES_IN = 60 * 5; // 5 min

export function getInviteId(inviteId: string) {
    return `kuest:invites:${inviteId}`;
}

export async function getInvite(inviteId: string): Promise<{ invite?: Invite, error?: string }> {
    try {
        const id = getInviteId(inviteId);
        const exists = await redis.exists(id);
        if (!exists) return {
            invite: undefined,
            error: "Invite has not been found"
        }

        const [competitionId, groupId, expiresAt] = await redis.hmget(id, ["competitionId", "groupId", "expiresAt"])

        return {
            invite: {
                competitionId: competitionId!,
                groupId: groupId!,
                expiresAt: JSON.parse(expiresAt!),
            }
        }

    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            invite: undefined,
            error: "An unknown database error has occured",
        }
    }
}

export async function createInvite(invite: CreateInvite): Promise<{ invite?: Invite, error?: string }> {
    try {

        const id = getInviteId(crypto.randomUUID());

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + invite.expiresIn);

        await redis.hset(id, {
            competitionId: invite.competitionId,
            groupId: invite.groupId,
            expiresAt: expiresAt.toString(),
        });
        await redis.expire(id, COMPETITION_INVITE_EXPIRES_IN);
        
        return {
            invite: {
                competitionId: invite.competitionId,
                groupId: invite.groupId,
                expiresAt: expiresAt,
            }
        }

    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            invite: undefined,
            error: "An unknown database error has occured",
        }
    }
}

export async function acceptInvite(inviteId: string): Promise<{ accepted: boolean, error?: string }> {
    try {

        const { invite, error } = await getInvite(inviteId);
        if (error) {
            throw new Error(error);
        }

        console.log("Accepted invite:", inviteId, " for:", invite?.competitionId);

        return {
            accepted: true,
        }
    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            accepted: false,
            error: "An unknown database error has occured",
        }
    }
}