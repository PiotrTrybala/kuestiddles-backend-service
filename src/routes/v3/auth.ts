import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const authRouter = new Hono<AppEnv>();