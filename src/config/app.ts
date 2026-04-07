
import { auth } from "./auth";
import { plans } from "../database/schema/stripe";

export type AppEnv = {
    Variables: {
        session: typeof auth.$Infer.Session.session | null,
        
        user: typeof auth.$Infer.Session.user | null,
        plan: typeof plans.$inferSelect | null,

        organization: typeof auth.$Infer.Organization | null,
        membership: typeof auth.$Infer.Member | null,
    }
};