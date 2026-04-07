import { Hono } from "hono";
import { type AppEnv } from "../config/app";
import { auth, googleMobileClient } from "../config/auth";

export const mobileRouter = new Hono<AppEnv>();

type MobileGoogle = {
    idToken: string,
};

mobileRouter.post("/google", async (c) => {
    const { idToken } = await c.req.json<MobileGoogle>();

    try {

        const ticket = await googleMobileClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, 
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
                }
            },
            headers: {
                ...c.req.raw.headers,
                "x-auth-source": "mobile",
            },
        });

        return c.json(session);

    } catch (error) {
        console.error("Mobile Login Error:", error);
        return c.json({ 
            error: "Authentication failed", 
            details: error instanceof Error ? error.message : "Unknown error" 
        }, 500);
    }
});