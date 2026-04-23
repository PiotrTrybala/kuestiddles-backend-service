import { Hono } from "hono";
import { type AppEnv } from "../../config/app";

export const publicRouter = new Hono<AppEnv>();