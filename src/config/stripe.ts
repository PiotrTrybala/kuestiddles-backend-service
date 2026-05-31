import { STRIPE_SECRET_KEY } from '@/globals';
import Stripe from 'stripe';

export const stripeClient = new Stripe(STRIPE_SECRET_KEY);
