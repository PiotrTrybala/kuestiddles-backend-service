import { pgTable, text, integer, geometry, index } from 'drizzle-orm/pg-core';

export const assets = pgTable('assets', {});

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
