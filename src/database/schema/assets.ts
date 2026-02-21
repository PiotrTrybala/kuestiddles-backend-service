import { sql } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { timestamps } from './utils';

export const DEFAULT_THUMBNAIL = "";

export const assets = pgTable('assets', {
    id: uuid().primaryKey().defaultRandom(),
    user_id: text().references(() => user.id),
    name: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps,
});