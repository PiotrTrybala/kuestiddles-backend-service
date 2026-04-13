import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./utils";
import { user } from "./auth";

export const avatars = pgTable('avatars', {
    user_id: text().notNull().references(() => user.id),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps,
});