import { relations } from 'drizzle-orm';
import { user, session, account } from './auth';
import { pgTable, text, integer, geometry, index, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';

export const plans = pgTable('plans', {
    id: uuid().primaryKey().defaultRandom(),

    name: text().notNull().unique(),
    stripe_price_id: text().notNull(),

    active: boolean().default(true).notNull(),

});

export const subscriptions = pgTable('subscriptions', {
    id: uuid().primaryKey().defaultRandom(),

    user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),

    plan_id: uuid().notNull().references(() => plans.id),

    stripe_subscription_id: text(),

    status: text().notNull(),

    current_period_end: timestamp(),

    created_at: timestamp().defaultNow().notNull(),
}, (table) => [
    index("subscriptions_user_idx").on(table.user_id),
    index("subscriptions_plan_idx").on(table.plan_id),
]);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(user, {
        fields: [subscriptions.user_id],
        references: [user.id],
    }),
    plan: one(plans, {
        fields: [subscriptions.plan_id],
        references: [plans.id],
    }),
}));