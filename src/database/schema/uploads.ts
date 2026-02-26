import { sql } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { timestamps } from './utils';
import { organizations } from './organizations';

export const UPLOADS_LABELS = ['profile', 'asset'];

export const uploads = pgTable('uploads', {
    id: uuid().primaryKey().defaultRandom(),
    organization_name: text().references(() => organizations.name),
    user_id: text().references(() => user.id),
    name: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps,
});