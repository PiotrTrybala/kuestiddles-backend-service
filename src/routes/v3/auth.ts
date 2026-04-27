import type { AppEnv } from "@/config/app";
import { auth, googleMobileClient } from "@/config/auth";
import { Hono } from "hono";

export const authRouter = new Hono<AppEnv>();

type MobileGoogleBody = {
    idToken: string;
    platform: "android" | "ios";
};

type MobileEmailBody = {
    email: string;
    password: string;
    platform: "android" | "ios";
};

type MobileSignUpBody = {
    email: string;
    password: string;
    name: string;
    platform: "android" | "ios";
};

authRouter.post("/google", async (c) => {
    const { idToken, platform } = await c.req.json<MobileGoogleBody>();

    if (!idToken) {
        return c.json({ error: "Missing idToken" }, 400);
    }

    if (!platform || !["android", "ios"].includes(platform)) {
        return c.json({ error: "Missing or invalid platform. Must be 'android' or 'ios'" }, 400);
    }

    try {
        const ticket = await googleMobileClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_MOBILE_CLIENT_ID!,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return c.json({ error: "Invalid Google Token" }, 401);
        }

        const session = await auth.api.signInSocial({
            body: {
                provider: "google",
                idToken: {
                    token: idToken,
                },
            },
            headers: {
                ...c.req.raw.headers,
                "x-auth-source": "mobile",
                "x-platform": platform,
            },
        });

        return c.json(session);

    } catch (error) {
        console.error("Mobile Google Auth Error:", error);
        return c.json({
            error: "Authentication failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
});

authRouter.post("/sign-in", async (c) => {
    const { email, password, platform } = await c.req.json<MobileEmailBody>();

    if (!email || !password) {
        return c.json({ error: "Missing email or password" }, 400);
    }

    if (!platform || !["android", "ios"].includes(platform)) {
        return c.json({ error: "Missing or invalid platform. Must be 'android' or 'ios'" }, 400);
    }

    try {
        const session = await auth.api.signInEmail({
            body: { email, password },
            headers: {
                ...c.req.raw.headers,
                "x-auth-source": "mobile",
                "x-platform": platform,
            },
        });

        return c.json(session);
    } catch (error) {
        console.error("Mobile Email Sign In Error:", error);
        return c.json({
            error: "Authentication failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
});

authRouter.post("/sign-up", async (c) => {
    const { email, password, name, platform } = await c.req.json<MobileSignUpBody>();

    if (!email || !password || !name) {
        return c.json({ error: "Missing email, password or name" }, 400);
    }

    if (!platform || !["android", "ios"].includes(platform)) {
        return c.json({ error: "Missing or invalid platform. Must be 'android' or 'ios'" }, 400);
    }

    try {
        const session = await auth.api.signUpEmail({
            body: { name, email, password, platform },
            headers: {
                ...c.req.raw.headers,
                "x-auth-source": "mobile",
                "x-platform": platform,
            },
        });

        return c.json(session);

    } catch (error) {
        console.error("Mobile Email Sign Up Error:", error);
        return c.json({
            error: "Authentication failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
});