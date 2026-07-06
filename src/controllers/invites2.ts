import { redis } from "@/config/redis";
import type { RepositoryError } from "@/repositories/v3/v3";
import { COMPETITION_INVITE_EXPIRES_IN, type Invite } from "./invites";
import type { Invitation } from "better-auth/plugins";

export type GroupInvitation = {
    id: string,
    competitionId: string,
    groupId: string,
    expiresAt: Date,
};

export type CreateGroupInvitation = {
    competitionId: string,
    groupId: string,
    expiresIn: number,
};

export function getInvitationId(competitionId: string, inviteId: string) {
    return `kuest:invitation:${competitionId}:${inviteId}`;
}

export async function getInvitation(competitionId: string, inviteId: string): Promise<{ invite?: GroupInvitation, error?: string }>{

    try {
        const invitation = await redis.hgetall(getInvitationId(competitionId, inviteId));
        return {
            invite: {
                id: invitation["id"] as string,
                competitionId: invitation["competitionId"] as string,
                groupId: invitation["groupId"] as string,
                expiresAt: new Date(invitation["expiresAt"] as string),
            }
        }

    } catch(error) {
        console.error("Error occured while retrieving invite:", error);
        return {
            invite: undefined,
            error: "An unexpected error occured during retrival of invitation",
        }
    }

}

export async function createInvitation(invite: CreateGroupInvitation): Promise<{ invite?: GroupInvitation & { invitationToken: string }, error?: string }> {
    try {
        console.log("create invitation group id = ", invite.groupId);
        const id = getInvitationId(invite.competitionId, crypto.randomUUID());
        const suffixId = `${id.split("invitation:")[1]}:${invite.groupId}`;
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
                id: id,
                competitionId: invite.competitionId,
                groupId: invite.groupId,
                expiresAt: expiresAt,
                invitationToken: suffixId as string,
            }
        }

    } catch(error) {
        console.error("Error occured while retrieving invite:", error);
        return {
            invite: undefined,
            error: "An unexpected error occured during creation of invitation",
        }
    }
}

export async function acceptInvitation(invitationToken: string): Promise<{ accepted: boolean, error?: string }> {
    try {

        const [ competitionId, invitationId ] = invitationToken.split(":");

        const { invite, error } = await getInvitation(competitionId!, invitationId!);
        if (error) {
            throw new Error(error);
        }

        console.log("Accepted invite:", invitationId, " for:", invite?.competitionId);

        return {
            accepted: true,
        }
    } catch(error) {
        console.error("Error occured while retrieving invite");
        return {
            accepted: false,
            error: "An unexpected error occured during acceptation of invitation",
        }
    }
}

export async function deleteInvitation(competitionId: string, inviteId: string) {
try {

        const { invite, error } = await getInvitation(competitionId, inviteId);
        if (error) {
            throw new Error(error!);
        }

        await redis.del(getInvitationId(competitionId, inviteId));

        return {
            deleted: true,
        }
    } catch(error) {
        console.error("Error occured while deleting invite:", error);
        return {
            deleted: false,
            error: "An unexpected error occured during deletion of invitation",
        }
    }
}