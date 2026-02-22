
import { timestamp } from 'drizzle-orm/pg-core';

export const DEFAULT_THUMBNAIL = "";

export const timestamps = {
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
};