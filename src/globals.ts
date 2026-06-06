
// General variables

export const UUID_PATTERN = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

export const APP_NAME = Bun.env.APP_NAME!;
export const APP_DOMAIN = Bun.env.APP_DOMAIN!;

export const AVATARS_URL = Bun.env.AVATARS_URL!;
export const IMAGES_URL = Bun.env.IMAGES_URL!;

export const COMPETITION_TOKEN_SECRET = Bun.env.COMPETITION_TOKEN_SECRET!;

// Authentication variables

export const BETTER_AUTH_URL = Bun.env.BETTER_AUTH_URL!;
export const BETTER_AUTH_SECRET = Bun.env.BETTER_AUTH_SECRET!;

// Base URLs

export const USER_API_URL = Bun.env.USER_API_URL!;
export const ADMIN_API_URL = Bun.env.ADMIN_API_URL!;
export const MOBILE_API_URL = Bun.env.MOBILE_API_URL!;

// Database variables

export const DATABASE_URL = Bun.env.DATABASE_URL!;
export const REDIS_URL = Bun.env.REDIS_URL!;

// Google OAuth variables

export const GOOGLE_CLIENT_ID = Bun.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = Bun.env.GOOGLE_CLIENT_SECRET!;
export const GOOGLE_MOBILE_CLIENT_ID = Bun.env.GOOGLE_MOBILE_CLIENT_ID!;

// Mailgun variables

export const MAILGUN_DOMAIN = Bun.env.MAILGUN_DOMAIN!;
export const MAILGUN_API_KEY = Bun.env.MAILGUN_API_KEY!;

// AWS variables

export const AWS_REGION = Bun.env.AWS_REGION!;
export const AWS_BUCKET_NAME = Bun.env.AWS_BUCKET_NAME!;
export const AWS_ACCESS_KEY_ID = Bun.env.AWS_ACCESS_KEY_ID!;
export const AWS_SECRET_ACCESS_KEY = Bun.env.AWS_SECRET_ACCESS_KEY!;

// Stripe variables

export const STRIPE_SECRET_KEY = Bun.env.STRIPE_SECRET_KEY!;
export const STRIPE_WEBHOOK_SECRET = Bun.env.STRIPE_WEBHOOK_SECRET!;
export const STRIPE_SUCCESS_URL = Bun.env.STRIPE_SUCCESS_URL!;
export const STRIPE_CANCEL_URL = Bun.env.STRIPE_CANCEL_URL!;
export const STANDARD_PLAN_PRICE_ID = Bun.env.PLAN_STANDARD_PRICE_ID!;