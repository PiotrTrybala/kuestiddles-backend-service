import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "./schema/schema";

const client = new Pool({ connectionString: process.env.DATABASE_URL! });
export const database = drizzle(client, { schema });

async function populatePlans() {

    try {
        await database.insert(schema.plans).values({
            name: "Basic",
            stripe_price_id: process.env.STRIPE_BASIC_PLAN_PRICE_ID!,

            organizations_quota: 1,
            landmarks_org_quota: 5,
            quests_per_org_quota: 10,
            simultaneous_comps_per_org_quota: 2,
            active: true,
        });

        await database.insert(schema.plans).values({
            name: "Enterprise",
            stripe_price_id: process.env.STRIPE_ENTERPRISE_PLAN_PRICE_ID!,

            organizations_quota: 5,
            landmarks_org_quota: 20,
            quests_per_org_quota: 50,
            simultaneous_comps_per_org_quota: 10,
            
            active: true,
        });
    } catch (error) {
        console.log('could not populate plans table:', error);
    }

}

await populatePlans();