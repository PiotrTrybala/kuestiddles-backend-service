import type { AppEnv } from "../config/app";
import { createMiddleware } from "hono/factory";
import { auth } from "../config/auth";
import { verifyCompetitionToken } from "./utils";

export const requireAuth = (role: "user" | "admin" | "none") => {
    return createMiddleware<AppEnv>(async (c, next) => {
        console.log('require auth middleware with:', role);
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (!session) return c.json({ message: "Unauthorized"}, 401);

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