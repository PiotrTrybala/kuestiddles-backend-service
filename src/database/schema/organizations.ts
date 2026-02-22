import { sql } from 'drizzle-orm';
import { pgTable, text, integer, geometry, index, uuid, timestamp, boolean, PgBigSerial53 } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { timestamps } from './utils';
import { DEFAULT_THUMBNAIL } from './utils';

export const organizations = pgTable('organizations', {
    name: text().primaryKey(),
    user_id: text().references(() => user.id),
    ...timestamps,
}, (table) => [
    index("org_name_idx").on(table.name),
]);

export const quests = pgTable('quests', {
    id: uuid().defaultRandom().primaryKey(),
    organization_name: text().references(() => organizations.name),
    landmark_id: uuid().notNull().references(() => landmarks.id),
    title: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    description: text().notNull(),
    thumbnail: text().notNull().default(DEFAULT_THUMBNAIL),
    assets: text().array().default(sql`'{}'::text[]`).notNull(),
    points: integer().notNull(),
    ...timestamps,
});

export const landmarks = pgTable('landmarks', {
    id: uuid().primaryKey().defaultRandom(),
    organization_name: text().references(() => organizations.name),
    name: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    thumbnail: text().notNull().default(DEFAULT_THUMBNAIL),
    assets: text().array().default(sql`'{}'::text[]`).notNull(),
    coords: geometry('coords', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    ...timestamps,
}, (table) => [
    index("spatial_index").using('gist', table.coords),
]);

export const questsSolved = pgTable('quests_solved', {
    quest_id: uuid().references(() => quests.id),
    user_id: text().references(() => user.id),
    solved: boolean().default(false).notNull(),
    ...timestamps,
});

export const landmarksVisited = pgTable('landmarks_visited', {
    landmark_id: uuid().references(() => landmarks.id),
    user_id: text().references(() => user.id),
    visited: boolean().default(true).notNull(),
    ...timestamps,
});

export const userStats = pgTable('user_statistics', {
    user_id: text().references(() => user.id),
    questsSolved: integer().notNull().default(0),
    landmarksVisited: integer().notNull().default(0),
    pointsTotal: integer().notNull().default(0),
    ...timestamps,
});