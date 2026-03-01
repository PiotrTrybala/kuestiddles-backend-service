
import { auth } from "./auth";
import { plans } from "../database/schema/stripe";
import type { organization } from "../database/schema/auth";
import type { organizationSchema } from "better-auth/plugins";

// TODO: Change this app env for better?

export type AppEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null,
        session: typeof auth.$Infer.Session.session | null,
        plan: typeof plans.$inferSelect | null,

        organization: typeof auth.$Infer.Organization | null,
        membership: typeof auth.$Infer.Member | null,
    }
};