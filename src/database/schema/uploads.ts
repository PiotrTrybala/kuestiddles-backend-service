import { sql } from 'drizzle-orm';
import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { member, organization, user } from './auth';
import { timestamps } from './utils';

export const UPLOADS_LABELS = ['profile', 'asset'];

export const uploads = pgTable('uploads', {
    id: uuid().primaryKey().defaultRandom().notNull(),
    organization_id: text().notNull().references(() => organization.id, { onDelete: 'cascade' }),
    member_id: text().notNull().references(() => member.id, { onDelete: 'no action' }),
    name: text().notNull(),
    labels: text().array().default(sql`'{}'::text[]`),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps,
}, (t) => ([
    unique("upload_org_idx").on(t.organization_id, t.name),
]));

