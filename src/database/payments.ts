import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const plans = pgTable("plans", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    name: text().notNull().unique(),
    price_id: text().notNull(),
    active: boolean().default(true).notNull(),
    organizations: integer().notNull(),
    organizations_games: integer().notNull(),
    organizations_quests: integer().notNull(),
    organizations_landmarks: integer().notNull(),
    organizations_competitions: integer().notNull(),
});

export const user_quotas = pgTable("user_quotas", {
    user_id: text().unique().references(() => user.id),
    organization_quota: integer().notNull().default(0), // by user
    landmarks_quota: integer().notNull().default(0), // by game
    quests_quota: integer().notNull().default(0), // by game
    uploads_quota: integer().notNull().default(0), // by organization
    games_quota: integer().notNull().default(0), // by organization
});