import { Hono } from 'hono';
import { cors } from "hono/cors";

import { auth } from './config/auth';

import { api } from './routes/api';
import { showRoutes } from 'hono/dev';

import { type AppEnv } from './config/app';

const app = new Hono<AppEnv>();

app.use(
	"/api/auth/*",
	cors({
		origin: ["http://localhost:5173", "https://www.kuestiddles.pl", "https://kuestiddles.pl", "http://127.0.0.1:8000"], // Add your local ADB bridge origin just in case],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use(
	"/api/*",
	cors({
		origin: ["http://localhost:5173", "https://www.kuestiddles.pl", "https://kuestiddles.pl", "http://127.0.0.1:8000"],
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

app.get("/health", (c) => {
    return c.json({ message: "Healthy service" });
});

app.route("/api", api);

console.log("Environment:", Bun.env.NODE_ENV);

showRoutes(app, {
	verbose: true,
	colorize: true,
});

export default {
	port: 3000,
	hostname: '0.0.0.0',
	fetch: app.fetch,
};