
import { boolean, integer, pgTable, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { timestamps } from "./utils";
import { quests } from "./games";

export const competitions = pgTable("competitions", {
    
    id: uuid().primaryKey().defaultRandom().notNull(),
    organization_id: text().notNull().references(() => organization.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text().notNull(),
    groups: integer().notNull().default(0),
    created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
    expires_at: timestamp({ withTimezone: true }).notNull().$defaultFn(() => {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // next day
        return expiresAt;
    }),

}, (t) => ([
    unique("unique_competition_idx").on(t.organization_id, t.name),
]));

export const competitionsGroups = pgTable("competition_groups", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    competition_id: uuid().references(() => competitions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text().notNull(),
    members: integer().notNull().default(0),
    solved: integer().notNull().default(0),
    ...timestamps,
});

export const competitionGroupUsers = pgTable("competition_group_users", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    group_id: uuid().notNull().references(() => competitionsGroups.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    username: text().notNull(),
    access_token: text().notNull(),
    ...timestamps,
});

export const competitionGroupSolved = pgTable("competition_group_solved", {
    group_id: uuid().notNull().references(() => competitionsGroups.id),
    user_id: uuid().notNull().references(() => competitionGroupUsers.id),
    quest_Id: uuid().notNull().references(() => quests.id),
    solved: boolean().notNull().default(false),
    ...timestamps,
});

export const competitionGroupInvites = pgTable("competition_group_invites", {
    id: uuid().primaryKey().defaultRandom().notNull(),
    group_id: uuid().notNull().references(() => competitionsGroups.id),
    expires_at: timestamp({ withTimezone: true }).notNull().$defaultFn(() => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        return expiresAt;
    }),
    ...timestamps,
});
