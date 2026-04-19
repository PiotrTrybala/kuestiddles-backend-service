import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

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