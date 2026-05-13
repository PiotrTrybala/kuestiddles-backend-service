import type { AppEnv } from "../config/app";
import { createMiddleware } from "hono/factory";
import { auth } from "../config/auth";
import { verifyCompetitionToken } from "./utils";
import type { QuotaType } from "@/repositories/v3/payments";

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

    console.info('organization slug:', slug);

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




        await next();
    });
}