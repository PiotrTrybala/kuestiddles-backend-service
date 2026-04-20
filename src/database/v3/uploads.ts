import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organization, user } from "../auth";
import { sql } from "drizzle-orm";
import { timestamps } from "../utils";

// uploads
export const uploads = pgTable("uploads", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    slug: text().notNull(),
    organization_id: text().notNull().references(() => organization.id),
    name: text().notNull(),
    labels: text().array().notNull().default(sql`'{}'::text[]`),
    path: text().notNull(),
    hash: text().notNull(),
    ...timestamps
}, (table) => [
    uniqueIndex("uploads_organization_slug_idx").on(table.organization_id, table.slug),
    
    index("uploads_labels_gin_idx").using("gin", table.labels),
    index("uploads_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
    index("uploads_organization_id_idx").on(table.organization_id),
]);

// avatars
export const avatars = pgTable("avatars", {
    user_id: text().notNull().references(() => user.id),
    path: text().notNull(),
    ...timestamps,
});