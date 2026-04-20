import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const adminRouter = new Hono<AppEnv>();

