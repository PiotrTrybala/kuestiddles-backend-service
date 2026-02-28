
import { pgTable, text, integer, geometry, index, uuid, timestamp, boolean, PgBigSerial53 } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { timestamps } from './utils';
import { quests } from './quests';

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
