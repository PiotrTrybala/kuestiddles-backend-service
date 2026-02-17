import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "./schema/schema";

const client = new Pool({ connectionString: process.env.DATABASE_URL! });
export const database = drizzle(client, { schema });