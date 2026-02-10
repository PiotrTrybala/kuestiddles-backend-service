import { pgTable, text, pgEnum, geometry, index, uuid, timestamp } from 'drizzle-orm/pg-core';

const timestamps = {
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull().$onUpdateFn(() => new Date()),
};

export const assets = pgTable('assets', {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(), 
    path: text().notNull(),
    ...timestamps,
});

export const quests = pgTable('quests', {});

export const landmarks = pgTable('landmarks', {
    coords: geometry('coords', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
},(table) => [
    index("spatial_index").using('gist', table.coords),
]);

export const competitions = pgTable('competitions', {});

export const groups = pgTable('groups', {});

export const groupUsers = pgTable('groups_users', {});

export const groupStatuses = pgTable('group_statuses', {});

export const landmarkReviews = pgTable('landmark_reviews', {});
