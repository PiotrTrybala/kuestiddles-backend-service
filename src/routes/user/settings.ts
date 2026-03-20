import { Hono } from "hono";
import type { AppEnv } from "../../config/app";

export const settingsRouter = new Hono<AppEnv>();

