import { Hono } from 'hono';
import { cors } from "hono/cors";

import { auth } from './config/auth';

import { api } from './routes/api';
import { showRoutes } from 'hono/dev';

import { type AppEnv } from './config/app';
import { database } from './database/db';
import { plans } from './database/schema/stripe';
import { requireUser } from './routes/user/middleware';

// TODO: Rewrite index.ts 

const app = new Hono<AppEnv>();

app.use(
	"/api/auth/*",
	cors({
		origin: ["http://localhost:5173", "https://www.kuestiddles.pl", "https://.kuestiddles.com"],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use(
	"/api/v1/*",
	cors({
		origin: ["http://localhost:5173", "https://www.kuestiddles.pl", "https://.kuestiddles.com"],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "PATCH", "DELETE"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("*", async (c, next) => {

	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		c.set("organization", null);
		c.set("plan", null);
		await next();
		return;
	}

	c.set("session", session.session);
	c.set("user", session.user);

	// TODO: Add plans to app env

	await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

app.get("/ping", (c) => {
    return c.json({ message: "Pong" });
});

app.route("/api", api);

// showRoutes(app, {
// 	verbose: true,
// });

export default app;