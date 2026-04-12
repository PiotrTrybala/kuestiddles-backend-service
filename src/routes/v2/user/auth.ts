import { Hono } from "hono";
import type { AppEnv } from "@/config/app";

export const userAuthRouter = new Hono<AppEnv>();