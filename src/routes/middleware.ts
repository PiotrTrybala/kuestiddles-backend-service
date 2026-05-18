import type { AppEnv } from "../config/app";
import { createMiddleware } from "hono/factory";
import { auth } from "../config/auth";
import { verifyCompetitionToken } from "./utils";
import { getUserQuotas, increaseUsagePoint, quotaColumnMap, type QuotaType } from "@/repositories/v3/payments";

export const requireAuth = (role: "user" | "admin" | "none") => {
    return createMiddleware<AppEnv>(async (c, next) => {
        console.log('require auth middleware with:', role);
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (!session) return c.json({ message: "Unauthorized" }, 401);

        c.set("session", session.session);
        c.set("user", session.user);

        if (role != "none") {
            if (session.user.role !== role) return c.json({ message: "Forbidden" }, 403);
        }

        await next();
    });
};

export const COMPETITION_TOKEN_HEADER = "x-competition-token";

export const requireCompetition = () => {
    return createMiddleware<AppEnv>(async (c, next) => {
        const competitionToken = c.req.header(COMPETITION_TOKEN_HEADER);
        if (!competitionToken) return c.body(null, 400);

        const token = verifyCompetitionToken(competitionToken);
        if (!token) return c.body(null, 403);

        c.set("competition", token);

        await next();
    });
}

export const requireOrganization = createMiddleware<AppEnv>(async (c, next) => {

    const user = c.get("user");
    const session = c.get("session");

    if (!user || !session) return c.json({ message: "Unauthorized" }, 401);

    const slug = c.req.param("organizationSlug");

    const organization = await auth.api.getFullOrganization({
        headers: c.req.raw.headers,
        query: {
            organizationSlug: slug,
        },
    });

    if (!organization) return c.json({ message: "Not found or forbidden" }, 403);

    const currentMember = organization.members.find(member => member.userId === user.id);
    if (!currentMember) return c.json({ message: "Forbidden" }, 403);

    const isOwner = currentMember.role === "owner";

    c.set("organization", organization);
    c.set("membership", currentMember);
    c.set("isOwner", isOwner);

    await next();
});

export const requireOrganizationOwner = createMiddleware<AppEnv>(async (c, next) => {
    const isOwner = c.get("isOwner");
    if (!isOwner) return c.json({ message: "Forbidden: Owner access required" }, 403);
    await next();
});

export const requireQuota = (type: QuotaType) => {
    return createMiddleware<AppEnv>(async (c, next) => {
        const user = c.get("user");

        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const userId = user.id;

        const subscription = await auth.api.listActiveSubscriptions({
            headers: c.req.raw.headers, 
        });

        const activeSubscription = subscription.find(
            sub => sub.status === "active"
        );

        const { quotas, error } = await getUserQuotas(userId);

        if (error || !quotas) {
            return c.json({ error: error ?? "Quota record not found" }, 404);
        }

        const limit = activeSubscription?.limits![type] as number;
        const column = quotaColumnMap[type] as keyof typeof quotas;
        const used = quotas[column] as number;

        if (used >= limit) {
            return c.json(
                { error: `Quota exceeded for ${type}: limit is ${limit}, used ${used}` },
                429
            );
        }

        await increaseUsagePoint(userId, type);

        await next();
    });
};