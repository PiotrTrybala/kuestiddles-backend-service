import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const questsRouter = new Hono<AppEnv>();