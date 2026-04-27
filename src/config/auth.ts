import { database } from "@/database/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sendResetPasswordEmail, sendVerificationEmail } from "./mailgun";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { stripeClient } from "./stripe";
import { stripe } from "@better-auth/stripe";
import { plans } from "@/database/schema/stripe";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

export const googleMobileClient = new OAuth2Client(process.env.GOOGLE_MOBILE_CLIENT_ID!);

export const auth = betterAuth({

    appName: process.env.APP_NAME ?? "kuestiddles",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET!,

    trustedOrigins: [
        "http://localhost:5173",
        "https://www.kuestiddles.pl",
        "https://*.kuestiddles.pl",
        "https://www.kuestdiddles.com",
        "https://*.kuestdiddles.com"
    ],

    database: drizzleAdapter(database, {
        provider: "pg",
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        autoSignIn: true,
        sendResetPassword: async ({ user, url, token }, _) => {
            console.log(`sent reset password email to ${user.email}`);
            await sendResetPasswordEmail(user.email, url);
        }
    },

    emailVerification: {
        async sendVerificationEmail({ user, url, token }) {
            console.log(`sent verification message to ${user.email}: ${token}`);
            await sendVerificationEmail(user.email, url);
        }
    },

    user: {
        additionalFields: {
            platform: {
                type: "string",
                nullable: true,        // missing in your original
            }
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
                before: async (user, ctx) => {
                    const platform = ctx?.headers?.get("x-platform") ?? null; // "android" | "ios" | null
                    const isMobile = platform !== null;

                    if (!user.username) {
                        const base = user.email.split("@")[0];
                        const random = Math.floor(100 + Math.random() * 900);
                        user.username = `${base}${random}`;
                    }

                    user.role = isMobile ? "user" : "admin";
                    user.platform = platform;

                    return {
                        data: {
                            ...user,
                        }
                    };
                },
                after: async (user) => {
                    // TODO: upload default avatar and update image URL
                    // await uploadAvatar(user.id, defaultProfilePictureFile as File);
                    // await db
                    //     .update(userTable)
                    //     .set({ image: `http://localhost:3000/api/v3/avatars/${user.id}.webp` })
                    //     .where(eq(userTable.id, user.id));
                    console.log(`New user created: ${user.email} on platform: ${user.platform}`);
                }
            }
        },

        account: {
            create: {
                after: async (account) => {
                    const provider = account.providerId === "credential" ? "email/password" : account.providerId;
                    console.log(`New sign-up via ${provider} for userId: ${account.userId}`);
                },
            }
        }
    },

    plugins: [
        admin(),
        twoFactor(),
        organization({
            allowUserToCreateOrganization: async (user) => {
                return user.role === "admin";
            }
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
                },
            },
        })
    ],
});