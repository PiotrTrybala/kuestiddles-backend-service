import type { AppEnv } from "@/config/app";
import { requireAuth } from "@/routes/middleware";
import { Hono } from "hono";

export const paymentsRouter = new Hono<AppEnv>();

type UpgradeSubscriptionPayload = {
    
};

paymentsRouter.post("/upgrade", requireAuth("admin"), async (c) => {



});

paymentsRouter.get("/", requireAuth("admin"), async (c) => {

});