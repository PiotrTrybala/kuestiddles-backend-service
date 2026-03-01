
import { auth } from "./auth";
import { plans } from "../database/schema/stripe";

export type AppEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null,
        plan: typeof plans.$inferSelect | null,
        session: typeof auth.$Infer.Session.session | null,

        organization: typeof auth.$Infer.Organization | null,
        member: typeof auth.$Infer.Member | null,
    }
};