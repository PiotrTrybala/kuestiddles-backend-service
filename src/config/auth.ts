import { database } from "@/database/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { stripeClient } from "./stripe";
import { stripe } from "@better-auth/stripe";
import { OAuth2Client } from "google-auth-library";
import { APP_NAME, AVATARS_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_MOBILE_CLIENT_ID, STANDARD_PLAN_PRICE_ID, STRIPE_WEBHOOK_SECRET } from "@/globals";
import { sendAccountResetPasswordEmail, sendAccountVerificationEmail } from "./mailgun";
import { createDefaultAvatar } from "@/repositories/v3/avatars";
import { updateUser } from "better-auth/api";
import { user } from "@/database/auth";
import { eq } from "drizzle-orm";

export const googleMobileClient = new OAuth2Client(GOOGLE_MOBILE_CLIENT_ID);

export const auth = betterAuth({

    appName: APP_NAME ?? "kuestiddles",
    baseURL: BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: BETTER_AUTH_SECRET!,

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
            await sendAccountResetPasswordEmail(user.email, url);
        }
    },

    emailVerification: {
        async sendVerificationEmail({ user, url, token }) {
            console.log(`sent verification message to ${user.email}: ${token}`);
            await sendAccountVerificationEmail(user.email, url);
        }
    },

    user: {
        additionalFields: {
            platform: {
                type: "string",
                nullable: true,
            }
        }
    },

    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        },
    },

    databaseHooks: {
        user: {
            create: {
                before: async (user, ctx) => {
                    const platform = ctx?.headers?.get("x-platform") ?? null;
                    const isMobile = platform !== null;

                    if (!user.username) {
                        const base = user.email.split("@")[0];
                        const random = Math.floor(100 + Math.random() * 900);
                        user.username = `${base}${random}`;
                    }

                    user.role = isMobile ? "user" : "admin";
                    user.platform = platform ?? "web"; // default value web if platform is not detected

                    return {
                        data: {
                            ...user,
                        }
                    };
                },
                after: async (newUser) => {

                    await createDefaultAvatar(newUser.id);

                    await database
                        .update(user)
                        .set({
                            image: `${AVATARS_URL}/${newUser.id}`
                        }).where(eq(user.id, newUser.id));

                    // TODO: upload default avatar and update image URL
                    // await uploadAvatar(user.id, defaultProfilePictureFile as File);
                    // await db
                    //     .update(userTable)
                    //     .set({ image: `http://localhost:3000/api/v3/avatars/${user.id}.webp` })
                    //     .where(eq(userTable.id, user.id));
                    console.log(`New user created: ${newUser.email} on platform: ${newUser.platform}`);
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
            stripeWebhookSecret: STRIPE_WEBHOOK_SECRET,
            createCustomerOnSignUp: true,
            subscription: {
                enabled: true,
                plans: [
                    {
                        name: "standard",
                        priceId: STANDARD_PLAN_PRICE_ID,
                        limits: {
                            landmarks: 20, // per game
                            quests: 20, // per game
                            uploads: 100,
                            games: 5,
                            competitions: 5, // at the same time
                        }
                    }
                ]
            },
        })
    ],
});