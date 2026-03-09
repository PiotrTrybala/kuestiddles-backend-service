import { pgTable, text, integer, geometry, index, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';

export const plans = pgTable('plans', {
    id: uuid().primaryKey().defaultRandom(),

    name: text().notNull().unique(),
    stripe_price_id: text().notNull(),

    organizations_quota: integer().notNull(),
    landmarks_org_quota: integer().notNull(),
    quests_per_org_quota: integer().notNull(),
    simultaneous_comps_per_org_quota: integer().notNull(), 

    active: boolean().default(true).notNull(),

});