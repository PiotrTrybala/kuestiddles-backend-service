
import type { plans } from "@/database/payments";
import { auth } from "./auth";
import type { CompetitionTokenPayload } from "@/routes/utils";

export type AppEnv = {
    Variables: {
        // Initialize this globally
        session: typeof auth.$Infer.Session.session | null,
        user: typeof auth.$Infer.Session.user | null,
        plan: typeof plans.$inferSelect | null,

        // Initialize this in Admin middleware somewhere
        organization: typeof auth.$Infer.Organization | null,
        membership: typeof auth.$Infer.Member | null,

        // Only used by temporary competition users
        competition: CompetitionTokenPayload | null,
    }
};