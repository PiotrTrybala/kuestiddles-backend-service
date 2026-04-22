import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { database } from "../database/db";
import { sendResetPasswordEmail, sendVerificationEmail } from './mailgun';

import { stripe } from "@better-auth/stripe";
import { admin, organization, twoFactor } from 'better-auth/plugins';

import { ConsoleLogWriter, eq } from 'drizzle-orm';
import { plans } from '../database/schema/stripe';
import { stripeClient } from './stripe';
import { OAuth2Client } from "google-auth-library";
import { uploadAvatar } from '@/repositories/v3/avatars';
import { defaultProfilePictureFile } from '@/static';

export const auth = betterAuth({
    database: drizzleAdapter(database, {
        provider: "pg",
    }),

    appName: process.env.APP_NAME!,
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

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    console.log(`user.id = ${user.id}`);

                    await uploadAvatar(user.id, defaultProfilePictureFile as File);
                    user.image = `http://localhost:3000/api/v3/avatars/${user.id}.webp`;
                },
                before: async (user) => {

                    // const isMobile = ctx!.headers?.get("x-auth-source") === "mobile";
                    
                    // TODO: Add user creation based on user agent (web-admin, mobile-user)

                    // if (isMobile) {
                    //     user.role = "user";
                    // } else {
                    //     user.role = "admin";
                    // }

                    user.role = "admin";
                    console.log(`user = ${JSON.stringify(user)}`);

                    if (!user.username) {
                        const base = user.email.split('@')[0];
                        const random = Math.floor(1000 + Math.random() * 9000);
                        user.username = `${base}${random}`;
                        if (!user.role)
                            user.role = "user";
                    }
                    // const { error } =

                    return { 
                        data: user
                    };
                }
            }
        }
    },

    plugins: [
        admin(),
        organization({ 
            allowUserToCreateOrganization: async (user) => {
                return user.role === "admin";
            },
        }),
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
    ],

    
});

export const googleMobileClient = new OAuth2Client(process.env.GOOGLE_MOBILE_CLIENT_ID!);