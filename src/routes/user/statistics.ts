import { Hono } from "hono";
import type { AppEnv } from "../../config/app";

export const statisticsRouter = new Hono<AppEnv>();

