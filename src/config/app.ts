
import { auth } from "./auth";
import { organizations } from "../database/schema/organizations";
import { plans } from "../database/schema/stripe";

export type AppEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null,
        session: typeof auth.$Infer.Session.session | null,
        organization: typeof organizations.$inferSelect | null,
        plan: typeof plans.$inferSelect | null,
    }
};