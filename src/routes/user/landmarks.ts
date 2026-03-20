import { Hono } from "hono";
import type { AppEnv } from "../../config/app";

export const landmarksRouter = new Hono<AppEnv>();