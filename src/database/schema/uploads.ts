import { sql } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { member, organization, user } from './auth';
import { timestamps } from './utils';

export const UPLOADS_LABELS = ['profile', 'asset'];

export const uploads = pgTable('uploads', {
    id: uuid().primaryKey().defaultRandom(),
    organization_id: text().references(() => organization.id),
    member_id: text().references(() => member.id),
    name: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps,
});