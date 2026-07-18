import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organization, user } from "../auth";
import { sql } from "drizzle-orm";
import { timestamps } from "../utils";

export const images = pgTable("images", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    organization_id: text().notNull().references(() => organization.id),
    slug: text().notNull(),
    labels: text().array().notNull().default(sql`'{}'::text[]`),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps,
}, (table) => [
    uniqueIndex("images_organization_slug_idx").on(table.organization_id, table.slug),
    index("images_labels_gin_idx").using("gin", table.labels),
    index("images_slug_trgm_idx").using("gin", table.slug.op("gin_trgm_ops")),
]);

export const avatars = pgTable("avatars", {
    user_id: text().notNull().references(() => user.id),
    path: text().notNull(),
    ...timestamps,
});