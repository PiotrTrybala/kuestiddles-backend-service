
import { arrayOverlaps, eq, ilike } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/pg-core';

export const DEFAULT_THUMBNAIL = "";
export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_UPLOAD_WEBP_QUALITY = 60;
export const DEFAULT_UPLOAD_WIDTH = 400;
export const DEFAULT_UPLOAD_HEIGHT = 300;

export const timestamps = {
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
};

export function getPageBounds(page: number, pageSize: number) {

    page = Math.max(0, page)
    pageSize = Math.max(DEFAULT_PAGE_SIZE, pageSize);

    return {
        offset: page * pageSize,
        limit: pageSize,
    }
}