import { sql } from 'drizzle-orm';
import { pgTable, text, integer, geometry, index, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth';

const timestamps = {
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
};

const DEFAULT_THUMBNAIL = "";

export const assets = pgTable('assets', {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps,
});

export const quests = pgTable('quests', {
    id: uuid().defaultRandom().primaryKey(),
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
    name: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    thumbnail: text().notNull().default(DEFAULT_THUMBNAIL),
    assets: text().array().default(sql`'{}'::text[]`).notNull(),
    coords: geometry('coords', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    ...timestamps,
}, (table) => [
    index("spatial_index").using('gist', table.coords),
]);

export const competitions = pgTable('competitions', {
    id: uuid().primaryKey().defaultRandom(),
    user_id: text().references(() => user.id),
    quest_id: uuid().references(() => quests.id),
    expires_at: timestamp().notNull().$defaultFn(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1); // expires in 1 day
        return date;
    }),
    ...timestamps,
});

export const groups = pgTable('groups', {
    id: uuid().primaryKey().defaultRandom(),
    competition_id: uuid().references(() => competitions.id),
    name: text().notNull(),
    members: integer().notNull().default(0),
    ...timestamps,
});

export const groupUsers = pgTable('groups_users', {
    id: uuid().primaryKey().defaultRandom(),
    competition_id: uuid().references(() => competitions.id),
    group_id: uuid().references(() => groups.id),
    username: text().notNull(),
    ...timestamps,
});

export const groupQuestsSolved = pgTable('group_quests_solved', {
    quest_id: uuid().references(() => quests.id),
    group_user_id: uuid().references(() => groupUsers.id),
    solved: boolean().default(false).notNull(),
    ...timestamps,
});

export const landmarkReviews = pgTable('landmark_reviews', {
    id: uuid().primaryKey().defaultRandom(),
    user_id: text().references(() => user.id),
    landmark_id: uuid().references(() => landmarks.id),
    rating: integer().notNull().default(0), // 1 - 5
    review: text().notNull(),
    ...timestamps,
});

export const questsSolved = pgTable('quests_solved', {
    quest_id: uuid().references(() => quests.id),
    user_id: text().references(() => user.id),
    ...timestamps,
});

export const landmarksVisited = pgTable('landmarks_visited', {
    landmark_id: uuid().references(() => landmarks.id),
    user_id: text().references(() => user.id),
    ...timestamps,
});

export const userStatistics = pgTable('user_statistics', {
    user_id: text().references(() => user.id),
    questsSolved: integer().notNull().default(0),
    landmarksVisited: integer().notNull().default(0),
    pointsTotal: integer().notNull().default(0),
    ...timestamps,
});
