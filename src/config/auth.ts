import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { database } from "../database/db";
import { sendResetPasswordEmail, sendVerificationEmail } from './mailgun';

import { stripe } from "@better-auth/stripe";
import { twoFactor } from 'better-auth/plugins';

import { eq } from 'drizzle-orm';
import { plans } from '../database/schema/stripe';
import { stripeClient } from './stripe';

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
        autoSignInAfterVerification: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            console.log(`sent reset password email to ${user.email}: ${token}`);
            await sendResetPasswordEmail(user.email, url);
        }
    },

    emailVerification: {
        async sendVerificationEmail({ user, url, token }) {
            console.log(`sent verification message to ${user.email}: ${token}`);  
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
            username: {
                type: "string",
                required: true,
            }
        }
    },

    plugins: [
        stripe({
            stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
            subscription: {
                enabled: true,
                plans: async () => {
                    const rows = await database.select().from(plans).where(eq(plans.active, true));

                    return rows.map((plan) => ({
                        name: plan.name,
                        priceId: plan.stripe_price_id,
                        limits: {
                            organizationsQuota: plan.organizations_quota,
                            landmarksPerOrgQuota: plan.landmarks_org_quota,
                            questsPerOrgQuota: plan.landmarks_org_quota,
                            simultaneousCompsPerQuota: plan.simultaneous_comps_per_org_quota,
                        }
                    }));
                }
            } 
        }),
        twoFactor(),
    ]
});