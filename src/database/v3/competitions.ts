import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { games, quests } from "./games";
import { organization } from "../auth";
import { timestamps } from "../utils";

export const INVITE_SECRET_SIZE = 64;
export const competitionStatus = pgEnum(
    "competition_status", 
    ["onboarding", "in-progress", "finishing", "archived"]
);

export const statusRank = {
    "onboarding": 0,
    "in-progress": 1,
    "finishing": 2,
    "archived": 10,
};

export const competitions = pgTable("competitions", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    slug: text().notNull(),

    organization_id: text().notNull().references(() => organization.id),
    game_id: uuid().notNull().references(() => games.id),

    name: text().notNull(),
    status: competitionStatus().notNull().default("onboarding"),

    finishes_at: timestamp().notNull().$defaultFn(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
    }),
    ...timestamps,
}, (table) => [
     uniqueIndex("competitions_organization_slug_idx").on(table.organization_id, table.slug),
]);

export const groups = pgTable("groups", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    slug: text().notNull(),
    competition_id: uuid().notNull().references(() => competitions.id),
    name: text().notNull(),
    members: integer().notNull().default(0),
    ...timestamps
}, (table) => [
    uniqueIndex("groups_competition_slug_idx").on(table.competition_id, table.slug),
]);

export const groupUsers = pgTable("groups_users", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    group_id: uuid().notNull().references(() => groups.id),
    username: text().notNull(),
    ...timestamps,
}, (table) => [
    uniqueIndex("username_group_idx").on(table.group_id, table.username),
]);

export const competitionsQuests = pgTable("competitions_quests", {
    competition_id: uuid().notNull().references(() => competitions.id),
    quest_id: uuid().notNull().references(() => quests.id),
}, (table) => [
    uniqueIndex("competitions_quests_idx").on(table.competition_id, table.quest_id)
]);

export const groupsQuests = pgTable("groups_quests", {
    group_id: uuid().notNull().references(() => groups.id),
    quest_id: uuid().notNull().references(() => quests.id),
    ...timestamps,
});