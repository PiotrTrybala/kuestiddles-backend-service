import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { database } from "../database/db";
import { sendVerificationEmail } from './mailgun';

import { stripe } from "@better-auth/stripe";
import { jwt } from 'better-auth/plugins';

import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { plans } from '../database/schema/stripe';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
});

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
        // twoFactor(),
        jwt(),
    ]
});