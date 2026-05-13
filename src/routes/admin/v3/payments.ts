import type { AppEnv } from "@/config/app";
import { auth } from "@/config/auth";
import { STRIPE_CANCEL_URL, STRIPE_SUCCESS_URL } from "@/globals";
import { getUserQuotas } from "@/repositories/v3/payments";
import { requireAuth } from "@/routes/middleware";
import { Hono } from "hono";

export const paymentsRouter = new Hono<AppEnv>();

paymentsRouter.get("/", requireAuth("admin"), async (c) => {

    const user = c.get("user")!;

    const subscriptions = await auth.api.listActiveSubscriptions({
        headers: c.req.raw.headers,
    });

    const activeSubscription = subscriptions.find(sub => sub.status === "active");

    const { quotas, error } = await getUserQuotas(user.id);
    if (error || !quotas) {
        return c.json({ message: "Quotas has not been found" }, 404);
    }

    const plans = auth.options.plugins?.flatMap((p: any) => p.subscription?.plans ?? []);
    const activePlan = plans?.find((p: any) => p.priceId === activeSubscription?.priceId);

    return c.json({
        subscription: activeSubscription ?? null,
        plan: activePlan ?? null,
        quotas,
    });
});

type UpgradeSubscriptionPayload = {
    plan: string,
};

paymentsRouter.post("/upgrade", requireAuth("admin"), async (c) => {
    const { plan } = await c.req.json<UpgradeSubscriptionPayload>();

    const data = await auth.api.upgradeSubscription({
        headers: c.req.raw.headers,
        body: {
            plan,
            successUrl: STRIPE_SUCCESS_URL ?? null,
            cancelUrl: STRIPE_CANCEL_URL ?? null,
        }
    });

    if (data?.url) {
        return c.redirect(data?.url);
    }

    return c.json({ error: "No redirect URL returned" }, 400);
});

