import { Hono } from 'hono';
import { cors } from "hono/cors";

import { auth } from './config/auth';

import { api } from './routes/api';
import { showRoutes } from 'hono/dev';

import { type AppEnv } from './config/app';

const app = new Hono<AppEnv>();

// app.use(
// 	"/api/auth/*",
// 	cors({
// 		origin: ["http://localhost:5173", "https://www.kuestiddles.pl", "https://kuestiddles.pl"],
// 		allowHeaders: ["Content-Type", "Authorization"],
// 		allowMethods: ["POST", "GET", "OPTIONS"],
// 		exposeHeaders: ["Content-Length"],
// 		maxAge: 600,
// 		credentials: true,
// 	}),
// );

app.use(
	"/api/*",
	cors({
		origin: ["http://localhost:5173", "https://www.kuestiddles.pl", "https://kuestiddles.pl"],
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
		c.set("session", null);
		c.set("user", null);
		c.set("plan", null);

		c.set("organization", null);
		c.set("membership", null);

		c.set("competition", null);
		await next();

		return;
	}

	c.set("session", session.session);
	c.set("user", session.user);
	c.set("plan", null);

	c.set("organization", null);
	c.set("membership", null);

	c.set("competition", null);
	await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.get("/health", (c) => {
	return c.json({ message: "Service healthy" });
});

app.route("/api", api);

showRoutes(app, {
	verbose: true,
	colorize: true,
});

export default app;