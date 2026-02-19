import { Hono } from "hono";
import { type AppEnv } from "../../config/app";

export const questsRouter = new Hono<AppEnv>();