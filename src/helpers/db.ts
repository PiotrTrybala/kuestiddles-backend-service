import { eq } from "drizzle-orm";
import { auth } from "../config/auth";
import { database } from "../database/db";
import { user } from "../database/schema/auth";

export async function initWithMockData() {

    console.log('initializing mock data');

    try {
        const { user: userWithRole } = await auth.api.createUser({
            body: {
                email: "trybalapiotr4@gmail.com",
                name: "test",
                password: "Piotrek123@root",
                role: "admin",
            }
        });

        await database.update(user).set({
            emailVerified: true,
        }).where(eq(user.id, userWithRole.id)); // Manually verify email in database
         

        await auth.api.createOrganization({ body: { 
            name: "Test Organization",
            slug: "test-org",
            userId: userWithRole.id,
        }});

        await auth.api.addMember({ body: {
            userId: userWithRole.id,
            role: "owner",
        }});

    } catch(error) {
        console.error("error while initializing db:", error);
    }
}