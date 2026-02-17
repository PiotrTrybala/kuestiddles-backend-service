import { Hono } from 'hono';
import { cors } from "hono/cors";

import { auth } from './config/auth';

import { api } from './routes/api';
import { showRoutes } from 'hono/dev';

const app = new Hono();

app.use(
	"/api/auth/*",
	cors({
		origin: ["http://localhost:5173", "https://www.kuestiddles.pl"],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);


app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

app.get("/ping", (c) => {
    return c.json({ message: "Pong" });
});

app.route("/api", api);

showRoutes(app, {
	verbose: true,
});

export default app;