import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { database } from "../database/db";
import { sendVerificationEmail } from './mailgun';

export const auth = betterAuth({
    database: drizzleAdapter(database, {
        provider: "pg",
    }),

    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,

    trustedOrigins: ["http://localhost:5173", "https://www.kuestiddles.com", "https://.kuestiddles.pl"],

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    emailVerification: {
        async sendVerificationEmail({ user, url, token }) {
            await sendVerificationEmail(user.email, url);
        }
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
            },
            plan: {
                type: "string",
                deafultValue: "basic",
            }
        }
    },
});