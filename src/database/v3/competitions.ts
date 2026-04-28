import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organization } from "../auth";
import { timestamps } from "../utils";
import { randomBytes } from "crypto";
import { quests } from "./games";

export const INVITE_SECRET_LENGTH = 64;

export const competitions = pgTable("competitions", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull(),
    organization_id: text().notNull().references(() => organization.id),
    invite_secret: text().notNull().$defaultFn(() => {
        return randomBytes(INVITE_SECRET_LENGTH).toBase64({ alphabet: "base64url" });
    }),
    expires_at: timestamp().notNull().$defaultFn(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
    }),
    retain_until: timestamp().notNull().$defaultFn(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
    }),
    ...timestamps,
});

export const groups = pgTable("groups", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    slug: text().notNull(),
    competition_id: uuid().notNull().references(() => competitions.id),
    name: text().notNull(),
    members: integer().notNull().default(0),
    ...timestamps,
}, (table) => [
    uniqueIndex("groups_competition_slug_idx").on(table.competition_id, table.slug),
]);

export const groupUsers = pgTable("group_users", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    group_id: uuid().notNull().references(() => groups.id),
    username: text().notNull(),
    ...timestamps,
}, (table) => [
    uniqueIndex("username_group_idx").on(table.group_id, table.username),
]);

export const invites = pgTable("group_invites", {
    id: uuid().notNull().defaultRandom().primaryKey(),
    competition_id: uuid().notNull().references(() => competitions.id),
    group_id: uuid().notNull().references(() => groups.id),
    expires_at: timestamp().notNull().$defaultFn(() => {
        const date = new Date();
        date.setMinutes(date.getMinutes() + 5);
        return date;
    }),
    ...timestamps,
});

export const leaderboard = pgTable("leaderboard", {
    id: uuid().notNull().defaultRandom().primaryKey(),
    competition_id: uuid().notNull().references(() => competitions.id),
    group_id: uuid().notNull().references(() => groups.id),
    points: integer().notNull().default(0),
    ...timestamps,
});

export const groupSolves = pgTable("group_solves", {
    group_id: uuid().notNull().references(() => groups.id),
    quest_id: uuid().notNull().references(() => quests.id),
    solved: boolean().notNull().default(false),
    ...timestamps,
});

