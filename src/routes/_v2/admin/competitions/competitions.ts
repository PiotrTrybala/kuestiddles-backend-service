import { Hono } from "hono";
import { type AppEnv } from "../../../config/app";

export const competitionsRouter = new Hono<AppEnv>();