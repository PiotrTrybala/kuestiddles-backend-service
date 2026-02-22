
import { auth } from "./auth";
import { organizations } from "../database/schema/organizations";

export type AppEnv = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null,
        session: typeof auth.$Infer.Session.session | null,
        organization: typeof organizations.$inferSelect | null,
    }
};