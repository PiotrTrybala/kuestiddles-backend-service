import "dotenv/config"
import { drizzle } from "drizzle-orm/bun-sql";

export const database = drizzle(process.env.DATABASE_URL!);