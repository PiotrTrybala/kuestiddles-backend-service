import { Hono } from "hono";
import { type AppEnv } from "../../config/app";

export const mobileRouter = new Hono<AppEnv>();