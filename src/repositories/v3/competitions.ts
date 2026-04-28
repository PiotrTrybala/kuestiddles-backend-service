import { database } from "@/database/db";
import { competitions, groups, groupUsers, invites, leaderboard, groupSolves } from "@/database/schema";
import { quests } from "@/database/schema/games";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import slugify from "slugify";

export async function searchCompetitions(organizationId: string, page: number, pageSize: number, name?: string) {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

        const filters = [
            eq(competitions.organization_id, organizationId),
        ];

        if (name && name.length > 0) {
            filters.push(ilike(competitions.slug, `%${name}%`));
        }

        const results = await database.select()
            .from(competitions)
            .where(and(...filters))
            .limit(limit)
            .offset(offset);

        return { results };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            results: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getCompetitionById(id: string) {
    try {
        const [competition] = await database.select()
            .from(competitions)
            .where(eq(competitions.id, id));

        if (!competition) {
            return {
                competition: undefined,
                error: "Competition has not been found",
            };
        }

        return { competition };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getCompetitionBySlug(organizationId: string, slug: string) {
    try {
        const [competition] = await database.select()
            .from(competitions)
            .where(and(eq(competitions.organization_id, organizationId), eq(competitions.slug, slug)));

        if (!competition) {
            return {
                competition: undefined,
                error: "Competition has not been found",
            };
        }

        return { competition };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getLeaderboard(competitionId: string) {
    try {
        const entries = await database.select()
            .from(leaderboard)
            .where(eq(leaderboard.competition_id, competitionId))
            .orderBy(desc(leaderboard.points));

        return { entries };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            entries: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function createCompetition(organizationId: string, name: string, slug?: string | null, expiresAt?: Date | null, retainUntil?: Date | null) {
    try {
        if (!slug) slug = slugify(name, { lower: true, trim: true });

        const [competition] = await database.insert(competitions)
            .values({
                organization_id: organizationId,
                name,
                slug,
                ...(expiresAt && { expires_at: expiresAt }),
                ...(retainUntil && { retain_until: retainUntil })
            })
            .returning();

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function updateCompetitionStatusById(id: string, expiresAt: Date, retainUntil: Date) {
    try {
        const [competition] = await database.update(competitions)
            .set({
                expires_at: expiresAt,
                retain_until: retainUntil,
            })
            .where(eq(competitions.id, id))
            .returning();

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            competition: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function removeCompetitionById(id: string) {
    try {
        const [competition] = await database.delete(competitions)
            .where(eq(competitions.id, id))
            .returning();

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}

export async function removeCompetitionBySlug(organizationId: string, slug: string) {
    try {
        const [competition] = await database.delete(competitions)
            .where(and(eq(competitions.organization_id, organizationId), eq(competitions.slug, slug)))
            .returning();

        return { id: competition?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}


// ─── Groups ───────────────────────────────────────────────────────────────────

export async function searchGroups(competitionId: string, page: number, pageSize: number, name?: string) {
    try {
        const offset = page * pageSize;
        const limit = pageSize;

        const filters = [
            eq(groups.competition_id, competitionId),
        ];

        if (name && name.length > 0) {
            filters.push(ilike(groups.name, `%${name}%`));
        }

        const results = await database.select()
            .from(groups)
            .where(and(...filters))
            .limit(limit)
            .offset(offset);

        return { results };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            results: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupById(id: string) {
    try {
        const [group] = await database.select()
            .from(groups)
            .where(eq(groups.id, id));

        if (!group) {
            return {
                group: undefined,
                error: "Group has not been found",
            };
        }

        return { group };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            group: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupBySlug(competitionId: string, slug: string) {
    try {
        const [group] = await database.select()
            .from(groups)
            .where(and(eq(groups.competition_id, competitionId), eq(groups.slug, slug)));

        if (!group) {
            return {
                group: undefined,
                error: "Group has not been found",
            };
        }

        return { group };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            group: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupUsers(groupId: string) {
    try {
        const users = await database.select()
            .from(groupUsers)
            .where(eq(groupUsers.group_id, groupId));

        return { users };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            users: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function createGroup(competitionId: string, name: string, slug?: string | null) {
    try {
        if (!slug) slug = slugify(name, { lower: true, trim: true });

        const [group] = await database.insert(groups)
            .values({
                competition_id: competitionId,
                slug,
                name,
            })
            .returning();

        return { id: group?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            group: undefined,
            error: "An unexpected database error occured",
        };
    }
}

export async function solveQuest(groupId: string, questId: string, answers: string[]) {
    try {
        const [quest] = await database.select()
            .from(quests)
            .where(eq(quests.id, questId));

        if (!quest) {
            return { error: "Quest has not been found" };
        }

        const [existing] = await database.select()
            .from(groupSolves)
            .where(
                and(
                    eq(groupSolves.group_id, groupId),
                    eq(groupSolves.quest_id, questId),
                )
            );

        if (existing?.solved) {
            return { error: "Quest has already been solved" };
        }

        const correctAnswers = quest!.answers ?? [];
        const isCorrect = answers.some((answer) =>
            correctAnswers.some((correct) => correct.toLowerCase() === answer.toLowerCase())
        );

        if (!isCorrect) {
            return { error: "Incorrect answer" };
        }

        if (existing) {
            await database.update(groupSolves)
                .set({ solved: true })
                .where(
                    and(
                        eq(groupSolves.group_id, groupId),
                        eq(groupSolves.quest_id, questId),
                    )
                );
        } else {
            await database.insert(groupSolves)
                .values({
                    group_id: groupId,
                    quest_id: questId,
                    solved: true,
                });
        }

        await database.update(leaderboard)
            .set({ points: sql`${leaderboard.points} + ${quest.points}` })
            .where(eq(leaderboard.group_id, groupId));

        return { success: true };
    } catch(error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}

export async function removeGroupById(id: string) {
    try {
        const [group] = await database.delete(groups)
            .where(eq(groups.id, id))
            .returning();

        return { id: group?.id };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            error: "An unexpected database error occured",
        };
    }
}


// ─── Invites ──────────────────────────────────────────────────────────────────

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


// ─── Client-facing routes ─────────────────────────────────────────────────────

export async function getCompetitionQuests(competitionId: string) {
    try {
        const questResults = await database.select()
            .from(groupSolves)
            .innerJoin(groups, eq(groupSolves.group_id, groups.id))
            .innerJoin(quests, eq(groupSolves.quest_id, quests.id))
            .where(eq(groups.competition_id, competitionId));

        return { quests: questResults };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            quests: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getGroupsUsers(competitionId: string) {
    try {
        const users = await database.select()
            .from(groupUsers)
            .innerJoin(groups, eq(groupUsers.group_id, groups.id))
            .where(eq(groups.competition_id, competitionId));

        return { users };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            users: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getCompetitionsLeaderboard(competitionId: string) {
    try {
        const entries = await database.select()
            .from(leaderboard)
            .innerJoin(groups, eq(leaderboard.group_id, groups.id))
            .where(eq(leaderboard.competition_id, competitionId))
            .orderBy(desc(leaderboard.points));

        return { entries };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            entries: [],
            error: "An unexpected database error occured",
        };
    }
}

export async function getSouvenirCertificate(competitionId: string, groupId: string) {
    try {
        const [entry] = await database.select({
            points: leaderboard.points,
            group_name: groups.name,
            members: groups.members,
        })
            .from(leaderboard)
            .innerJoin(groups, eq(leaderboard.group_id, groups.id))
            .where(
                and(
                    eq(leaderboard.competition_id, competitionId),
                    eq(leaderboard.group_id, groupId),
                )
            );

        if (!entry) {
            return { certificate: undefined, error: "Leaderboard entry has not been found" };
        }

        const solves = await database.select({
            quest_id: groupSolves.quest_id,
            solved: groupSolves.solved,
            title: quests.title,
            points: quests.points,
        })
            .from(groupSolves)
            .innerJoin(quests, eq(groupSolves.quest_id, quests.id))
            .where(
                and(
                    eq(groupSolves.group_id, groupId),
                    eq(groupSolves.solved, true),
                )
            );

        return {
            certificate: {
                group_name: entry.group_name,
                members: entry.members,
                total_points: entry.points,
                solves,
            },
        };
    } catch (error) {
        console.error("Internal database error:", error);
        return {
            certificate: undefined,
            error: "An unexpected database error occured",
        };
    }
}