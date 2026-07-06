import { redis } from "@/config/redis";
import { formatError, type RepositoryError } from "@/repositories/v3/v3";

export type Invite = {
    id: string,
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

export function getInviteId(competitionId: string, inviteId: string) {
    return `kuest:invites:${competitionId}:${inviteId}`;
}

export async function getInvites(competitionId: string): Promise<{ invites: Invite[], error?: RepositoryError }> {
    try {
        let cursor = "0";
        const invites: Invite[] = [];

        do {

            const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `kuest:invites:${competitionId}`, "COUNT", 20);
            cursor = nextCursor;

            if (keys.length > 0) {
                const batchPromises = keys.map(key => redis.hgetall(key));
                const rawHashes = await Promise.all(batchPromises);

                const parsedInvites = rawHashes.map(hash => ({
                    id: hash['id'] as string,
                    competitionId: hash['competitionId'] as string,
                    groupId: hash['groupId'] as string,
                    expiresAt: new Date(hash['expiresAt']!)
                }));

                invites.push(...parsedInvites);
            }

        } while(cursor !== "0");

        return {
            invites: invites,
        };
    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            invites: [],
            error: formatError(error),
        }
    }
}

export async function getInvite(competitionId: string, inviteId: string): Promise<{ invite?: Invite, error?: RepositoryError }> {
    try {
        const id = getInviteId(competitionId, inviteId);
        const exists = await redis.exists(id);
        if (!exists) return {
            invite: undefined,
            error: { message: "Invite has not been found", status: 404 }
        }

        const [groupId, expiresAt] = await redis.hmget(id, ["competitionId", "groupId", "expiresAt"])

        return {
            invite: {
                id: inviteId,
                competitionId: competitionId,
                groupId: groupId!,
                expiresAt: JSON.parse(expiresAt!),
            }
        }

    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            invite: undefined,
            error: formatError(error),
        }
    }
}

export async function createInvite(invite: CreateInvite): Promise<{ invite?: Invite, error?: RepositoryError }> {
    try {

        const id = getInviteId(invite.competitionId, crypto.randomUUID());

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
                id,
                competitionId: invite.competitionId,
                groupId: invite.groupId,
                expiresAt: expiresAt,
            }
        }

    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            invite: undefined,
            error: formatError(error),
        }
    }
}

export async function acceptInvite(inviteToken: string): Promise<{ accepted: boolean, error?: RepositoryError }> {
    try {

        const [competitionId, inviteId] = inviteToken.split(":");

        const { invite, error } = await getInvite(competitionId!, inviteId!);
        if (error) {
            throw new Error(error!.message);
        }

        console.log("Accepted invite:", inviteId, " for:", invite?.competitionId);

        return {
            accepted: true,
        }
    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            accepted: false,
            error: formatError(error),
        }
    }
}

export async function removeInvite(competitionId: string, inviteId: string): Promise<{ deleted: boolean, error?: RepositoryError }> {
    try {

        const { invite, error } = await getInvite(competitionId, inviteId);
        if (error) {
            throw new Error(error!.message);
        }

        await redis.del(getInviteId(competitionId, inviteId));

        return {
            deleted: true,
        }
    } catch(error) {
        console.error("Error occured while deleting invite:", error);
        return {
            deleted: false,
            error: formatError(error),
        }
    }
}