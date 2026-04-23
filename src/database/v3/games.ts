import { geometry, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organization } from "../auth";
import { timestamps } from "../utils";
import { sql } from "drizzle-orm";

export const DEFAULT_THUMBNAIL = "";

export const games = pgTable("games", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    slug: text().notNull().unique(),
    organization_id: text().notNull().references(() => organization.id),
    name: text().notNull(),
    assets: text().array().notNull().default(sql`'{}'::text[]`),
    ...timestamps,
}, (table) => [
    uniqueIndex("games_organization_slug_idx").on(table.organization_id, table.slug)
]);

export const quests = pgTable("quests", {
    id: uuid().notNull().defaultRandom().primaryKey(),
    slug: text().notNull(),
    organization_id: text().notNull().references(() => organization.id),
    game_id: uuid().references(() => games.id),
    title: text().notNull(),
    description: text().notNull(),
    thumbnail: text().notNull().default(""),
    points: integer().notNull(),
    answers: text().array().notNull().default(sql`'{}'::text[]`),
    ...timestamps,
}, (table) => [
    uniqueIndex("quests_organization_slug_idx").on(table.organization_id, table.slug)
]);
export const landmarks = pgTable("landmarks", {
    id: uuid().notNull().primaryKey().defaultRandom(),
    slug: text().notNull(),
    organization_id: text().notNull().references(() => organization.id),
    quest_id: uuid().references(() => quests.id),
    title: text().notNull(),
    description: text().notNull(),
    assets: text().array().notNull().default(sql`'{}'::text[]`),
    coords: geometry('coords', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    ...timestamps,
}, (table) => [
    index("spatial_index").using('gist', table.coords),
    uniqueIndex("landmarks_organization_slug_idx").on(table.organization_id, table.slug)
]);