import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { database } from "../database/db";

export const auth = betterAuth({
    database: drizzleAdapter(database, {
        provider: "pg",
    }),

    // secret: process.env.BETTER_AUTH_SECRET!,

    // trustedOrigins: ["http://localhost:5173", "https://www.kuestiddles.com", "https://.kuestiddles.pl"],

    // emailAndPassword: {
    //     enabled: true,
    // },

    // socialProviders: {
    //     google: {
    //         clientId: process.env.GOOGLE_CLIENT_ID!,
    //         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //     },

    //     facebook: {
    //         clientId: process.env.FACEBOOK_CLIENT_ID!,
    //         clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    //     }
    // },

    // user: {
    //     additionalFields: {
    //         role: {
    //             type: "string",
    //             defaultValue: "user",
    //         }
    //     }
    // },
});